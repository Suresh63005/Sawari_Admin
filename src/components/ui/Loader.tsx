// ./ui/Loader.tsx
import React from 'react';
import LoaderImage from '../../../public/Loader.gif';
import Image from 'next/image';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <Image
        src={LoaderImage}
        alt="Loading..."
        className="w-[300px] h-[300px]"
      />
    </div>
  );
};

export default Loader;
