/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { HttpsError, onCall } = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
const axios = require("axios"); // Added axios for making HTTP requests

admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// Helper function to get/create Stripe Customer ID
const getOrCreateStripeCustomer = async (userId, userEmail) => {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    // Return existing customer ID if found
    if (userData?.stripeCustomerId) {
        console.log(`Found existing Stripe Customer ID for user ${userId}: ${userData.stripeCustomerId}`);
        return userData.stripeCustomerId;
    }

    // Create a new Stripe customer
    console.log(`Creating new Stripe Customer for user ${userId}, email: ${userEmail}`);
    const stripe = require("stripe")(process.env.STRIPE_SECRET);
    try {
        const customer = await stripe.customers.create({
            email: userEmail,
            metadata: {
                firebaseUID: userId,
            },
        });

        // Save the new customer ID to Firestore
        await userRef.set({ stripeCustomerId: customer.id }, { merge: true });
        console.log(`Created and saved Stripe Customer ID for user ${userId}: ${customer.id}`);
        return customer.id;
    } catch (error) {
        console.error(`Error creating Stripe customer for user ${userId}:`, error);
        throw new HttpsError("internal", "Could not create Stripe customer.");
    }
};

// --- Create Checkout Session (Uses Customer ID) ---
exports.createStripeCheckoutSession = onCall(async (request) => {
    // Destructure data and context from the request object passed to onCall
    const { data, auth } = request;

    // Use process.env for environment variables in v2
    const stripeSecretKey = process.env.STRIPE_SECRET;
    if (!stripeSecretKey) {
        console.error("Stripe secret key is not defined in environment variables.");
        // For onCall, just throw the HttpsError
        throw new HttpsError("internal", "Server configuration error.");
    }
    const stripe = require("stripe")(stripeSecretKey);

    // onCall automatically checks authentication if the function isn't configured
    // to allow unauthenticated access. The check below adds an explicit layer.
    if (!auth) {
        console.error("Function called without authentication context.");
        throw new HttpsError("unauthenticated", "Function must be called while authenticated.");
    }

    const userId = auth.uid;
    // Ensure email exists, handle case where it might not (optional based on your needs)
    const userEmail = auth.token.email;
    if (!userEmail) {
        console.warn(`User ${userId} does not have an email associated with their auth token.`);
        // Depending on requirements, you might throw an error or proceed without email
        // For now, let's proceed but log it.
    }

    // Access productId from the data object
    const productId = data.productId;

    if (!productId) {
        throw new HttpsError("invalid-argument", "productId is required in the data payload.");
    }

    try {
        // 1. Get or Create Stripe Customer ID for the user
        // Pass userEmail which might be undefined - ensure getOrCreateStripeCustomer handles this
        const customerId = await getOrCreateStripeCustomer(userId, userEmail);

        // 2. Create Stripe Checkout Session with Customer ID
        const YOUR_DOMAIN = "http://localhost:5173"; // Consider making this an env variable
        const successUrl = `${YOUR_DOMAIN}/submit/success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${YOUR_DOMAIN}/submit`;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer: customerId,
            line_items: [{ price: 'price_1QGrArDRgvwK8lM2GIofSdbB', quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
            metadata: {
                productId: productId,
                firebaseUID: userId,
            }
        });

        console.log(`Stripe Checkout Session Created for customer ${customerId}: ${session.id}`);
        // For onCall, return the data directly
        return { id: session.id };

    } catch (error) {
        // Log the full error object for detailed debugging in Cloud Functions
        console.error("Detailed Error in createStripeCheckoutSession:", JSON.stringify(error, Object.getOwnPropertyNames(error)));

        // Keep existing logging for context
        console.error("Error in createStripeCheckoutSession:", error);

        if (error instanceof HttpsError) {
            throw error;
        }
        // Include the original error message in the details passed back
        // Ensure the error object passed here is serializable if needed
        throw new HttpsError("internal", `Could not create Stripe checkout session. Original error: ${error.message}`, { originalError: error.message });
    }
});

// --- Webhook Handler (v1 onRequest - Largely the same) ---
exports.stripeWebhookHandler = functions.https.onRequest(async (req, res) => {
    // Use process.env for environment variables in v2
    const stripeSecretKey = process.env.STRIPE_SECRET;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) { console.error("Stripe secret key is not defined."); res.status(500).send("Server configuration error: Missing Stripe secret key."); return; }
    const stripe = require("stripe")(stripeSecretKey);

    if (!webhookSecret) { console.error("Stripe webhook secret is not configured."); res.status(500).send("Webhook secret not configured."); return; }

    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) { console.error(`⚠️ Webhook signature verification failed:`, err.message); res.status(400).send(`Webhook Error: ${err.message}`); return; }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('Webhook: CheckoutSession completed!', session.id, "Customer:", session.customer);
            console.log('Webhook Metadata:', session.metadata);

            const productId = session.metadata.productId;

            if (!productId) { console.error("Error: Product ID missing in session metadata.", session.id); res.status(200).send('Event received, but metadata missing productId.'); return; }

            try {
                const db = admin.firestore();
                const productRef = db.collection('products').doc(productId);
                await productRef.update({ premium: true });
                console.log(`Webhook: Successfully marked product ${productId} as premium.`);
            } catch (firestoreError) { console.error(`Error updating Firestore for product ${productId}:`, firestoreError); res.status(500).send(`Firestore update error: ${firestoreError.message}`); return; }
            break;
        default:
            console.log(`Webhook: Unhandled event type ${event.type}`);
    }
    res.status(200).send('Webhook Handled Successfully');
});

// --- Beehiiv Newsletter Subscription Function ---
exports.subscribeToNewsletter = onCall(async (request) => {
    const { data, auth } = request;

    // Ensure user is authenticated (optional, but good practice if tied to user actions)
    // If this can be called by unauthenticated users (e.g., on a public sign-up form before login),
    // you might remove or adjust this check.
    if (!auth) {
        logger.error("subscribeToNewsletter called without authentication.");
        throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { email, firstName } = data;

    if (!email) {
        logger.error("Email is required for newsletter subscription.");
        throw new HttpsError("invalid-argument", "Email is required.");
    }

    // Retrieve Beehiiv API Key and Publication ID from Firebase environment configuration
    // Set these using:
    // firebase functions:config:set beehiiv.key="YOUR_API_KEY"
    // firebase functions:config:set beehiiv.publication_id="YOUR_PUBLICATION_ID"
    // Or use process.env if you set them directly as environment variables in GCP.
    const beehiivApiKey = process.env.BEEHIIV_API_KEY || functions.config().beehiiv?.key;
    const beehiivPublicationId = process.env.BEEHIIV_PUBLICATION_ID || functions.config().beehiiv?.publication_id;

    if (!beehiivApiKey || !beehiivPublicationId) {
        logger.error("Beehiiv API key or Publication ID is not configured in Firebase functions environment.");
        throw new HttpsError("internal", "Server configuration error related to newsletter service.");
    }

    const BEEHIIV_API_URL = `https://api.beehiiv.com/v2/publications/${beehiivPublicationId}/subscriptions`;

    const requestPayload = {
        email: email,
        reactivate_existing: false,
        send_welcome_email: false,
        custom_fields: []
    };

    if (firstName) {
        requestPayload.custom_fields.push({
            name: "First Name", // Ensure this matches your Beehiiv custom field name
            value: firstName
        });
    }

    try {
        logger.info(`Attempting to subscribe ${email} to Beehiiv publication ${beehiivPublicationId}`);
        const beehiivResponse = await axios.post(BEEHIIV_API_URL, requestPayload, {
            headers: {
                'Authorization': `Bearer ${beehiivApiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        logger.info('Successfully subscribed to Beehiiv newsletter:', beehiivResponse.data);
        return { success: true, message: 'Successfully subscribed to newsletter.', data: beehiivResponse.data };

    } catch (error) {
        logger.error('Error subscribing to Beehiiv:');
        let errorMessage = 'Failed to subscribe to newsletter.';
        let errorDetails = null;

        if (error.response) {
            logger.error('Beehiiv API Error Data:', error.response.data);
            logger.error('Beehiiv API Error Status:', error.response.status);
            errorDetails = error.response.data;
            if (error.response.data && error.response.data.errors) {
                errorMessage = error.response.data.errors.map(e => e.message || e.detail).join(', ') || errorMessage;
            }
        } else if (error.request) {
            logger.error('Beehiiv API No Response:', error.request);
            errorMessage = 'No response received from newsletter service.';
        } else {
            logger.error('Beehiiv API Request Setup Error:', error.message);
            errorMessage = `An unexpected error occurred: ${error.message}`;
        }
        // For onCall, throw HttpsError
        throw new HttpsError("internal", errorMessage, { details: errorDetails });
    }
});

// --- Update Daily Rankings (Scheduled Function) ---
exports.updateDailyRankings = onSchedule("0 0 * * *", async (event) => { // Runs daily at midnight UTC
    logger.info("Running Daily Ranking Update...");

    const db = admin.firestore();
    const productsRef = db.collection('products');

    // Calculate yesterday's date range (UTC)
    const now = new Date();
    const yesterdayStart = new Date(now);
    yesterdayStart.setUTCDate(now.getUTCDate() - 1);
    yesterdayStart.setUTCHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setUTCHours(23, 59, 59, 999);

    const yesterdayStartTimestamp = admin.firestore.Timestamp.fromDate(yesterdayStart);
    const yesterdayEndTimestamp = admin.firestore.Timestamp.fromDate(yesterdayEnd);

    logger.info(`Querying products launched between ${yesterdayStart.toISOString()} and ${yesterdayEnd.toISOString()}`);

    try {
        // Query for products launched yesterday, order by upvotes
        const q = productsRef
            .where('launch_date', '>=', yesterdayStartTimestamp)
            .where('launch_date', '<=', yesterdayEndTimestamp)
            .orderBy('launch_date', 'asc') // Secondary sort if needed
            .orderBy('upvote', 'desc');

        const snapshot = await q.get();

        if (snapshot.empty) {
            logger.info("No products launched yesterday. No rankings to update.");
            return null;
        }

        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logger.info(`Found ${products.length} products launched yesterday.`);

        // TODO: Clear badges from previous day's winners? 
        // Optional: Query for products with badge #1, #2, #3 and clear them first.
        // For simplicity, we'll just overwrite/set the new ones for now.

        // Update top 3 products
        const batch = db.batch();
        const badges = ["#1", "#2", "#3"];

        for (let i = 0; i < Math.min(products.length, 3); i++) {
            const product = products[i];
            const badge = badges[i];
            const productDocRef = productsRef.doc(product.id);
            batch.update(productDocRef, { badge: badge });
            logger.info(`Assigning badge ${badge} to product ${product.id} (${product.product_name}) with ${product.upvote} upvotes.`);
        }

        await batch.commit();
        logger.info(`Successfully updated badges for top ${Math.min(products.length, 3)} products.`);
        return null;

    } catch (error) {
        logger.error("Error updating daily rankings:", error);
        // Throwing an error might cause the function to retry, depending on configuration
        throw error; // Or return null if retry isn't desired
    }
});

// Underdog Function (v2 onSchedule - Uncomment if needed)

exports.updateUnderdogCollection = onSchedule({
    schedule: '1 0 * * *',
    timeZone: 'Europe/Amsterdam',
    memory: '1GiB',
    timeoutSeconds: 300,
  }, async (event) => {
    const db = admin.firestore();
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const dateStr = today.toISOString().split('T')[0];
      console.log(`${dateStr}: Updating underdog...`);
      const productsQuery = db.collection('products').where('launch_date', '>=', thirtyDaysAgo);
      const productsSnapshot = await productsQuery.get();
      const eligibleProducts = [];
      productsSnapshot.forEach(doc => { if (doc.data().premium !== true) { eligibleProducts.push({ id: doc.id }); } });
      console.log(`Found ${productsSnapshot.size} recent, ${eligibleProducts.length} eligible.`);
      if (eligibleProducts.length === 0) { console.log('No eligible products found.'); return null; }
      const randomIndex = Math.floor(Math.random() * eligibleProducts.length);
      const selectedProduct = eligibleProducts[randomIndex];
      await db.collection('system').doc('underdog').set({ productId: selectedProduct.id, updatedAt: admin.firestore.FieldValue.serverTimestamp(), dateStr: dateStr }, { merge: true });
      console.log(`Underdog updated: ${selectedProduct.id}`); return null;
    } catch (error) { console.error('Error updating underdog:', error); return null; }
});

// --- File Upload Functions ---
const { v4: uuidv4 } = require('uuid');

// Helper function to upload file to Firebase Storage
const uploadToStorage = async (fileBuffer, fileName, contentType, folder) => {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`${folder}/${fileName}`);
    
    const stream = file.createWriteStream({
      metadata: {
        contentType: contentType,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(error);
      });

      stream.on('finish', async () => {
        try {
          await file.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          resolve({
            url: publicUrl,
            storage_path: file.name
          });
        } catch (error) {
          console.error('Error making file public:', error);
          reject(error);
        }
      });

      stream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
};

// --- Complete Onboarding Function ---
exports.completeOnboarding = functions.https.onRequest(async (req, res) => {
  // Set CORS headers for all responses
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authentication
    const authorization = req.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid token' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log('completeOnboarding: Processing for user', userId);

    // 2. Get Data from JSON Body
    const { username, displayName, personalLink, bio } = req.body;

    // 3. Validation
    if (!username || !displayName || !bio) {
       console.error('Validation failed: Missing fields.', { 
         username: !!username, 
         displayName: !!displayName, 
         bio: !!bio
       });
       return res.status(400).json({ 
        error: 'Missing required fields: username, displayName, bio' 
      });
    }

    // 4. Save to Firestore
    const db = admin.firestore();
    const userDocRef = db.collection('users').doc(userId);
    
    await userDocRef.set({
      username: username.trim(),
      displayName: displayName.trim(),
      personalLink: personalLink?.trim() || null,
      bio: bio.trim(),
      onboardingCompleted: true,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      email: decodedToken.email,
      profilePicture: null // Explicitly set to null or a default placeholder
    }, { merge: true });

    console.log('completeOnboarding: Success for user', userId);
    res.status(200).json({ 
      success: true, 
      message: 'Profile completed successfully.'
    });

  } catch (error) {
    console.error('completeOnboarding error:', error);
    let errorMessage = 'Internal server error';
    if (error.code === 'auth/id-token-expired') {
        errorMessage = 'Authentication token has expired. Please log in again.';
        return res.status(401).json({ error: errorMessage, details: error.message });
    }
    res.status(500).json({ 
      error: errorMessage, 
      details: error.message 
    });
  }
});

// --- Submit Product Function ---
exports.submitProduct = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Verify Authentication
    const authorization = req.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid token' });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    console.log('[submitProduct] Processing for user', userId);

    // 2. Get Data from JSON Body
    const {
      product_name,
      tagline,
      description,
      taglines,
      product_url,
      linkedin_url,
      twitter_url,
      dealDescription,
      dealCode,
      selectedPackage,
      logo, // This is now a URL
      images // This is now an array of URLs
    } = req.body;

    // 3. Validation
    if (!product_name || !tagline || !description || !product_url || !logo || !images || images.length === 0) {
      console.error('[submitProduct] Validation failed: Missing fields.', req.body);
      return res.status(400).json({ 
        error: 'Missing required fields. Ensure all fields including logo and images are provided.' 
      });
    }

    // 4. Generate Slug & Prepare Data
    const slug = product_name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    console.log(`[submitProduct] Slug generated: ${slug}`);

    // 5. Calculate Launch Date
    const db = admin.firestore();
    const productsRef = db.collection('products');
    let finalLaunchDate;
    const MAX_FREE_PER_WEEK = 20;

    if (selectedPackage === 'paid') {
      // Premium products launch next Monday at 01:00
      const nextMonday = new Date();
      const currentDay = nextMonday.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay; // If Sunday, go to tomorrow (Monday), else calculate days to next Monday
      
      nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
      nextMonday.setUTCHours(1, 0, 0, 0);
      finalLaunchDate = admin.firestore.Timestamp.fromDate(nextMonday);
    } else {
      // Free products: Weekly limit of 20, launch on Monday if space available
      let checkMonday = new Date();
      const currentDay = checkMonday.getDay();
      
      // Start with THIS week's Monday first
      const daysToThisMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, Monday = 1
      checkMonday.setUTCDate(checkMonday.getUTCDate() - daysToThisMonday);
      checkMonday.setUTCHours(0, 0, 0, 0);

      const MAX_WEEKS_TO_CHECK = 52; // Maximum 3 months ahead
      let weeksChecked = 0;
      
      while (weeksChecked < MAX_WEEKS_TO_CHECK) {
        // Calculate week range (Monday to Sunday)
        const weekStart = new Date(checkMonday);
        const weekEnd = new Date(checkMonday);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6); // Add 6 days to get Sunday
        weekEnd.setUTCHours(23, 59, 59, 999);

        const weekStartTimestamp = admin.firestore.Timestamp.fromDate(weekStart);
        const weekEndTimestamp = admin.firestore.Timestamp.fromDate(weekEnd);

        // Count non-premium products scheduled for this week
        const q = productsRef
          .where('premium', '==', false)
          .where('launch_date', '>=', weekStartTimestamp)
          .where('launch_date', '<=', weekEndTimestamp);

        const snapshot = await q.count().get();
        const count = snapshot.data().count;

        if (count < MAX_FREE_PER_WEEK) {
          // Set launch for this Monday at 01:00
          const launchMondayAt1AM = new Date(checkMonday);
          launchMondayAt1AM.setUTCHours(1, 0, 0, 0);
          finalLaunchDate = admin.firestore.Timestamp.fromDate(launchMondayAt1AM);
          break;
        } else {
          // Move to next Monday
          checkMonday.setUTCDate(checkMonday.getUTCDate() + 7);
          weeksChecked++;
        }
      }
      
      // If no slot found within MAX_WEEKS_TO_CHECK, schedule for the last checked Monday
      if (!finalLaunchDate) {
        const fallbackMondayAt1AM = new Date(checkMonday);
        fallbackMondayAt1AM.setUTCHours(1, 0, 0, 0);
        finalLaunchDate = admin.firestore.Timestamp.fromDate(fallbackMondayAt1AM);
        console.warn(`[submitProduct] No free slot found within ${MAX_WEEKS_TO_CHECK} weeks. Scheduling for ${fallbackMondayAt1AM.toISOString()}`);
      }
    }
    console.log(`[submitProduct] Launch date calculated: ${finalLaunchDate.toDate()}`);

    // 6. Save Product to Firestore
    const productData = {
      product_name,
      tagline,
      description,
      taglines: taglines || [],
      product_url,
      linkedin_url: linkedin_url || null,
      twitter_url: twitter_url || null,
      logo: logo, // URL from client
      images: images, // Array of URLs from client
      dealDescription: dealDescription || null,
      dealCode: dealCode || null,
      submissionType: selectedPackage,
      slug,
      upvote: 1, // Start with 1 upvote (submitter's own vote)
      upvotes: { [userId]: true }, // Add submitter to upvotes map
      launch_date: finalLaunchDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      submitterId: userId,
      creatorEmail: decodedToken.email || null,
      premium: false
    };

    const docRef = await productsRef.add(productData);
    console.log(`[submitProduct] Product saved with ID: ${docRef.id}`);

    // 7. Add submitter to their own upvotedProducts array
    try {
      const userDocRef = db.collection('users').doc(userId);
      await userDocRef.update({
        upvotedProducts: admin.firestore.FieldValue.arrayUnion(docRef.id)
      });
      console.log(`[submitProduct] Added product ${docRef.id} to user ${userId}'s upvotedProducts`);
    } catch (upvoteError) {
      console.error('[submitProduct] Error adding product to user upvotedProducts:', upvoteError);
    }

    // 8. Add Notification
    try {
      const notificationsRef = db.collection('users').doc(userId).collection('notifications');
      const launchDateForMessage = finalLaunchDate.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
      
      await notificationsRef.add({
        type: "product_submission",
        productName: product_name,
        productId: docRef.id,
        productSlug: slug,
        submissionType: selectedPackage,
        launchDate: finalLaunchDate,
        message: `Your product '${product_name}' has been submitted successfully. Scheduled launch date: ${launchDateForMessage}.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
        link: `/product/${slug}`
      });
      console.log(`[submitProduct] Notification added for user ${userId}`);
    } catch (notificationError) {
      console.error('[submitProduct] Error adding notification:', notificationError);
    }

    console.log('[submitProduct] Success for user', userId, 'Product ID:', docRef.id);
    res.status(200).json({ 
      success: true, 
      productId: docRef.id,
      slug: slug,
      launchDate: finalLaunchDate.toDate().toISOString()
    });

  } catch (error) {
    console.error('[submitProduct] Uncaught error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});
