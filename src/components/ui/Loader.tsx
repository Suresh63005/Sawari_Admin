import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex justify-center items-center h-screen bg-white bg-opacity-0 z-50">
      <img src="/loader.gif" alt="Loading..." className="w-[300px] h-[300px]" />
    </div>
  );
};

export default Loader;