import React from 'react';
import LoaderImage from '../../../public/Loader.gif'; // Renamed import to avoid conflict
import Image from 'next/image';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex justify-center items-center h-screen bg-white bg-opacity-0 z-50">
      <Image src={LoaderImage} alt="Loading..." className="w-[300px] h-[300px]" />
    </div>
  );
};

export default Loader;