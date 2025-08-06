import React, { useState, useEffect } from 'react';

function LaunchCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    function getNextMonday3AM() {
      const now = new Date();
      const nextMonday = new Date();
      nextMonday.setUTCHours(3, 0, 0, 0);
      nextMonday.setUTCDate(nextMonday.getUTCDate() + ((7 - nextMonday.getUTCDay() + 1) % 7));
      if (now.getUTCDay() === 1 && now.getUTCHours() >= 3) {
        nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);
      }
      return nextMonday;
    }

    function updateCountdown() {
      const now = new Date();
      const nextLaunch = getNextMonday3AM();
      const difference = nextLaunch - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm font-mono opacity-50">battle ends in:</span>
      <div className="flex items-center gap-1">
        <TimeUnit value={timeLeft.days} unit="d" showSeparator />
        <TimeUnit value={timeLeft.hours} unit="h" showSeparator />
        <TimeUnit value={timeLeft.minutes} unit="m" showSeparator />
        <TimeUnit value={timeLeft.seconds} unit="s" />
      </div>
    </div>
  );
}

function TimeUnit({ value, unit, showSeparator }) {
  return (
    <>
      <span className="font-mono text-sm text-black font-semibold">
        {value.toString().padStart(2, '0')}{unit}
      </span>
      {showSeparator && <span className="text-gray-400">•</span>}
    </>
  );
}

export default LaunchCountdown; 