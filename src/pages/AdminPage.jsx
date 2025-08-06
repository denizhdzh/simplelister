import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  getCountFromServer,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  where
} from 'firebase/firestore';
import { app, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Chart from 'react-apexcharts';

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [totalUsers, setTotalUsers] = useState(0);
  const [latestProducts, setLatestProducts] = useState([]);
  const [productsByLaunchDate, setProductsByLaunchDate] = useState({});
  const [sponsors, setSponsors] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [premiumProductsCount, setPremiumProductsCount] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingLaunchView, setLoadingLaunchView] = useState(true);
  const [loadingSponsors, setLoadingSponsors] = useState(true);
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [error, setError] = useState('');

  // State for sponsor form (add/edit)
  const [editingSponsorId, setEditingSponsorId] = useState(null);
  const [sponsorForm, setSponsorForm] = useState({ name: '', logoUrl: '', targetUrl: '', showName: true });
  const [isSubmittingSponsor, setIsSubmittingSponsor] = useState(false);

  const db = getFirestore(app);

  useEffect(() => {
    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',') : [];
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (adminEmails.includes(user.email)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/');
        }
      } else {
        setIsAdmin(false);
        navigate('/');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch Total Users
  useEffect(() => {
    if (!isAdmin || authLoading) return;
    const fetchTotalUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersCollectionRef = collection(db, 'users');
        const snapshot = await getCountFromServer(usersCollectionRef);
        setTotalUsers(snapshot.data().count);
        setError('');
      } catch (err) {
        console.error("Error fetching total users:", err);
        setError('Failed to load user count.');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchTotalUsers();
  }, [db, isAdmin, authLoading]);

  // Fetch Latest 10 Products
  useEffect(() => {
    if (!isAdmin || authLoading) return;
    const fetchLatestProducts = async () => {
      try {
        setLoadingProducts(true);
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLatestProducts(products);
        setError('');
      } catch (err) {
        console.error("Error fetching latest products:", err);
        setError('Failed to load latest products.');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchLatestProducts();
  }, [db, isAdmin, authLoading]);

  // Updated: Fetch Products for Launch Date Chart (Past 5 days & Next ~25 days)
  useEffect(() => {
    if (!isAdmin || authLoading) return;
    const fetchProductsForLaunchChart = async () => {
      setLoadingLaunchView(true);
      try {
        const productsRef = collection(db, 'products');
        // Query products ordered by launch_date. Filtering will happen client-side based on the calculated range.
        const q = query(productsRef, orderBy('launch_date', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 5); // Start 5 days ago
        startDate.setHours(0, 0, 0, 0); // Set to start of the day

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 30); // End 30 days from the new start date (approx. 25 days in future)
        endDate.setHours(23, 59, 59, 999); // Set to end of the day

        const groupedProducts = {};
        querySnapshot.docs.forEach(docData => {
          const product = { id: docData.id, ...docData.data() };
          if (product.launch_date && product.launch_date.toDate) {
            const launchDate = product.launch_date.toDate();
            // Check if the launchDate falls within our 30-day window
            if (launchDate >= startDate && launchDate <= endDate) { 
              const dateStr = launchDate.toISOString().split('T')[0];
              if (!groupedProducts[dateStr]) {
                groupedProducts[dateStr] = [];
              }
              groupedProducts[dateStr].push(product);
            }
          }
        });
        setProductsByLaunchDate(groupedProducts);
      } catch (err) {
        console.error("Error fetching products for launch chart:", err);
        setError(prev => prev + ' Failed to load product launch schedule.');
      } finally {
        setLoadingLaunchView(false);
      }
    };
    fetchProductsForLaunchChart();
  }, [db, isAdmin, authLoading]);

  // Fetch Product Counts (Total and Premium)
  useEffect(() => {
    if (!isAdmin || authLoading) return;
    const fetchProductCounts = async () => {
      setLoadingCounts(true);
      try {
        const productsRef = collection(db, 'products');
        // Get total products count
        const totalSnapshot = await getCountFromServer(productsRef);
        setTotalProductsCount(totalSnapshot.data().count);

        // Get premium products count
        const premiumQuery = query(productsRef, where("submissionType", "==", "paid"));
        const premiumSnapshot = await getCountFromServer(premiumQuery);
        setPremiumProductsCount(premiumSnapshot.data().count);

      } catch (err) {
        console.error("Error fetching product counts:", err);
        setError(prev => prev + ' Failed to load product counts.');
      } finally {
        setLoadingCounts(false);
      }
    };
    fetchProductCounts();
  }, [db, isAdmin, authLoading]);

  // Fetch Sponsors
  const fetchSponsors = async () => {
    if (!isAdmin || authLoading) return;
    setLoadingSponsors(true);
    try {
      const sponsorsRef = collection(db, 'sponsors');
      const q = query(sponsorsRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      setSponsors(querySnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() })));
      setError(''); // Clear previous errors if successful
    } catch (err) {
      console.error("Error fetching sponsors:", err);
      setError(prev => prev + ' Failed to load sponsors.');
    } finally {
      setLoadingSponsors(false);
    }
  };

  useEffect(() => {
    if (!isAdmin || authLoading) return;
    fetchSponsors();
  }, [db, isAdmin, authLoading]);

  const handleSponsorFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSponsorForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetSponsorForm = () => {
    setSponsorForm({ name: '', logoUrl: '', targetUrl: '', showName: true });
    setEditingSponsorId(null);
  };

  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    if (!sponsorForm.name.trim() || !sponsorForm.targetUrl.trim()) {
      alert('Sponsor Name and Target URL are required.');
      return;
    }
    setIsSubmittingSponsor(true);
    const dataToSave = {
      name: sponsorForm.name.trim(),
      logo: sponsorForm.logoUrl.trim() || null,
      url: sponsorForm.targetUrl.trim(),
      showName: sponsorForm.showName,
    };

    try {
      if (editingSponsorId) {
        // Update existing sponsor
        const sponsorRef = doc(db, 'sponsors', editingSponsorId);
        await updateDoc(sponsorRef, dataToSave);
        alert('Sponsor updated successfully!');
      } else {
        // Add new sponsor
        await addDoc(collection(db, 'sponsors'), { ...dataToSave, createdAt: Timestamp.now() });
        alert('Sponsor added successfully!');
      }
      resetSponsorForm();
      fetchSponsors();
    } catch (err) {
      console.error("Error saving sponsor:", err);
      alert(`Failed to ${editingSponsorId ? 'update' : 'add'} sponsor.`);
      setError(prev => prev + ` Failed to save sponsor.`);
    } finally {
      setIsSubmittingSponsor(false);
    }
  };

  const handleEditSponsor = (sponsor) => {
    setEditingSponsorId(sponsor.id);
    setSponsorForm({
      name: sponsor.name || '',
      logoUrl: sponsor.logo || '',
      targetUrl: sponsor.url || '',
      showName: sponsor.showName === undefined ? true : sponsor.showName
    });
  };

  const handleRemoveSponsor = async (sponsorId) => {
    if (!window.confirm('Are you sure you want to remove this sponsor?')) return;
    try {
      await deleteDoc(doc(db, 'sponsors', sponsorId));
      fetchSponsors();
      alert('Sponsor removed successfully!');
      if (editingSponsorId === sponsorId) resetSponsorForm();
    } catch (err) {
      console.error("Error removing sponsor:", err);
      alert('Failed to remove sponsor.');
      setError(prev => prev + ' Failed to remove sponsor.');
    }
  };

  const handleToggleShowName = async (sponsorId, currentShowName) => {
    const sponsorRef = doc(db, 'sponsors', sponsorId);
    try {
      await updateDoc(sponsorRef, { showName: !currentShowName });
      fetchSponsors();
    } catch (err) {
      console.error("Error toggling showName:", err);
      alert('Failed to update sponsor visibility.');
      setError(prev => prev + ' Failed to update sponsor visibility.');
    }
  };

  const renderTimestamp = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    return 'N/A';
  };

  // Prepare data for Launch Date Bar Chart
  const launchDateChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: Object.keys(productsByLaunchDate).sort(),
      title: {
        text: 'Launch Date Window',
        style: { color: '#4B5563' }
      },
      labels: { style: { colors: '#6B7280' } }
    },
    yaxis: {
      title: {
        text: 'Number of Products',
        style: { color: '#4B5563' }
      },
      labels: {
        formatter: function (val) {
          return Math.floor(val); // Ensure only whole numbers on y-axis
        },
        style: { colors: '#6B7280' }
      },
      tickAmount: 5 // Or adjust as needed
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " products"
        }
      }
    },
    colors: ['#EF4444'] // Red-500 for chart bars
  };

  const launchDateChartSeries = [
    {
      name: 'Products Scheduled/Launched',
      data: Object.keys(productsByLaunchDate).sort().map(date => productsByLaunchDate[date].length) // Count for each sorted date
    }
  ];

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Header /> {/* Assuming Header handles user state for admin access */}
      <div className="container mx-auto p-4 pt-20 min-h-screen"> {/* Removed bg-gray-50 */}
        <h1 className="text-2xl font-semibold mb-6 text-gray-700">Admin Dashboard</h1>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm">{error}</div>}

        {/* Section 1: Key Metrics */}
        <section className="mb-6 p-4 border border-gray-200 rounded-md bg-white">
          <h2 className="text-xl font-semibold mb-3 text-gray-600">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Total Users */}
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <h3 className="text-md font-medium text-red-700">Total Users</h3>
              {loadingUsers ? <p className="text-2xl font-bold text-red-800 animate-pulse">Loading...</p> : <p className="text-2xl font-bold text-red-800">{totalUsers}</p>}
            </div>
            {/* Placeholder for other metrics e.g. Total Products, Active Submissions */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-700">Total Products</h3>
              {loadingCounts ? <p className="text-2xl font-bold text-gray-800 animate-pulse">...</p> : <p className="text-2xl font-bold text-gray-800">{totalProductsCount}</p>}
            </div>
             <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-md font-medium text-gray-700">Premium Products</h3>
              {loadingCounts ? <p className="text-2xl font-bold text-gray-800 animate-pulse">...</p> : <p className="text-2xl font-bold text-gray-800">{premiumProductsCount}</p>}
            </div>
          </div>
        </section>

        {/* Section 2: Latest 10 Products */}
        <section className="mb-6 p-4 border border-gray-200 rounded-md bg-white">
          <h2 className="text-xl font-semibold mb-3 text-gray-600">Latest 10 Submitted Products</h2>
          {loadingProducts ? (
            <div className="animate-pulse space-y-2">
              {[...Array(3)].map((_, i) => ( <div key={i} className="h-10 bg-gray-200 rounded"></div> ))}
            </div>
          ) : latestProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tagline</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Launch</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                     <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th> {/* Added Status */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {latestProducts.map(product => (
                    <tr key={product.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800">{product.product_name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 truncate max-w-xs">{product.tagline}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{renderTimestamp(product.createdAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{renderTimestamp(product.launch_date)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{product.submissionType === 'paid' ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">{product.status || 'N/A'}</td> {/* Display Status */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No products found.</p>
          )}
        </section>

        {/* Section 3: Products by Launch Date (ApexCharts) */}
        <section className="mb-6 p-4 border border-gray-200 rounded-md bg-white">
          <h2 className="text-xl font-semibold mb-3 text-gray-600">Product Launch Schedule (Past 5 & Next ~25 Days)</h2>
          {loadingLaunchView ? (
            <div className="animate-pulse h-[350px] bg-gray-200 rounded-md"></div>
          ) : Object.keys(productsByLaunchDate).length > 0 ? (
            <Chart
              options={launchDateChartOptions}
              series={launchDateChartSeries}
              type="bar"
              height={350}
            />
          ) : (
            <p className="text-gray-500 text-sm">No products scheduled in this window to display in chart.</p>
          )}
        </section>
        
        {/* Sponsor Management Section (Enhanced) */}
        <section className="p-4 border border-gray-200 rounded-md bg-white">
          <h2 className="text-xl font-semibold mb-3 text-gray-600">Manage Sponsors</h2>
          
          <form onSubmit={handleSaveSponsor} className="mb-4 p-3 border border-gray-200 rounded-md">
            <h3 className="text-lg font-medium mb-2 text-gray-600">{editingSponsorId ? 'Edit Sponsor' : 'Add New Sponsor'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              <div>
                <label htmlFor="sponsorName" className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input type="text" name="name" id="sponsorName" value={sponsorForm.name} onChange={handleSponsorFormChange} required className="w-full p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm" />
              </div>
              <div>
                <label htmlFor="sponsorTargetUrl" className="block text-xs font-medium text-gray-600 mb-1">Target URL *</label>
                <input type="url" name="targetUrl" id="sponsorTargetUrl" value={sponsorForm.targetUrl} onChange={handleSponsorFormChange} required className="w-full p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm" />
              </div>
            </div>
            <div className="mb-2">
              <label htmlFor="sponsorLogoUrl" className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
              <input type="url" name="logoUrl" id="sponsorLogoUrl" value={sponsorForm.logoUrl} onChange={handleSponsorFormChange} className="w-full p-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm" />
            </div>
            <div className="mb-3">
                <label htmlFor="showNameToggleForm" className="flex items-center cursor-pointer">
                    <input type="checkbox" id="showNameToggleForm" name="showName" checked={sponsorForm.showName} onChange={handleSponsorFormChange} className="form-checkbox h-4 w-4 text-red-600 rounded focus:ring-red-500" />
                    <span className="ml-2 text-xs text-gray-600">Display sponsor name on site</span>
                </label>
            </div>
            <div className="flex items-center space-x-2">
                <button type="submit" disabled={isSubmittingSponsor} className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-60">
                {isSubmittingSponsor ? (editingSponsorId ? 'Updating...' : 'Adding...') : (editingSponsorId ? 'Update Sponsor' : 'Add Sponsor')}
                </button>
                {editingSponsorId && (
                <button type="button" onClick={resetSponsorForm} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-medium rounded-md hover:bg-gray-300 focus:outline-none">
                    Cancel Edit
                </button>
                )}
            </div>
          </form>

          <h3 className="text-lg font-medium mb-2 text-gray-600">Current Sponsors</h3>
          {loadingSponsors ? (
            <div className="animate-pulse h-10 bg-gray-200 rounded w-full"></div>
          ) : sponsors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target URL</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Show Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sponsors.map(sponsor => (
                    <tr key={sponsor.id}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {sponsor.logo ? 
                          <img src={sponsor.logo} alt={sponsor.name} className="h-8 w-auto max-w-[80px] object-contain rounded" /> :
                          <span className="text-xs text-gray-400">No logo</span>
                        }
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-700">{sponsor.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600 truncate max-w-sm">
                        <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline hover:text-red-800">{sponsor.url}</a>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <label htmlFor={`showName-${sponsor.id}`} className="flex items-center cursor-pointer">
                            <input type="checkbox" id={`showName-${sponsor.id}`} checked={sponsor.showName === undefined ? true : sponsor.showName} onChange={() => handleToggleShowName(sponsor.id, sponsor.showName === undefined ? true : sponsor.showName)} className="form-checkbox h-4 w-4 text-red-600 rounded focus:ring-red-500" />
                        </label>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm space-x-2">
                        <button onClick={() => handleEditSponsor(sponsor)} className="text-gray-600 hover:text-gray-800 font-medium focus:outline-none text-xs">
                          Edit
                        </button>
                        <button onClick={() => handleRemoveSponsor(sponsor.id)} className="text-red-600 hover:text-red-800 font-medium focus:outline-none text-xs">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No sponsors found.</p>
          )}
        </section>

      </div>
    </>
  );
}

export default AdminPage; 