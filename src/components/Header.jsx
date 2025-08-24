// components/Header.jsx
import React from "react";

export default function Header() {
  return (
    <div style={styles.topBanner}>
      {/* Static top banner image */}
    </div>
  );
}

const styles = {
  topBanner: {
    height: "50vh",
    backgroundImage: `url("/homebanner1.jpg")`, 
    backgroundSize: "cover",
    backgroundPosition: "center",
    width: "100%",
  },
};
