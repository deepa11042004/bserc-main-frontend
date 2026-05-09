import React from "react";
import Image from "next/image";
const NavBanner = () => {
  return (
    <div>
      <Image
        src="/img/NavBar_Banner.jpeg"
        alt="NavBanner"
        priority
        loading="eager"
        width={1920}
        height={1080}
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default NavBanner;
