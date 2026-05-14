import Link from "next/link";
import React from "react";

const StudentLoginButton = () => {
  return (
    <Link
      href="/login"
      prefetch={false}
      className="relative px-6 py-2 font-semibold text-white rounded-lg overflow-hidden group"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-80 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></span>
      <span className="relative z-10">Log In</span>
    </Link>
  );
};

export default StudentLoginButton;
