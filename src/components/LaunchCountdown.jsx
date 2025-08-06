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
    <div className="inline-flex items-baseline space-x-1.5 bg-red-50/50 border border-red-100 rounded-md py-1.5 px-2.5">
      <span className="text-xs font-medium text-gray-900">Next Launch: </span>
      <div className="flex items-baseline space-x-1">
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
      <div className="flex items-baseline">
        <span className="font-mono text-red-500 font-bold tracking-tight">{value.toString().padStart(2, '0')}</span>
        <span className="text-[10px] text-red-500 ml-0.5 font-medium">{unit}</span>
      </div>
      {showSeparator && <span className="text-red-300">:</span>}
    </>
  );
}

export default LaunchCountdown; 