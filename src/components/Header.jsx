import React, { useState } from "react";
import styles from "../styles/Header.module.css";

export default function Home() {


  const sections = [
    { image: "/image1.PNG" },
    { image: "/img2.jpeg" },
    { image: "/homebanner1.jpg" },
    { image: "/home.jpg" },
    { image: "/newimage.jpg" }, 
  ];

  return (
    <div className={styles.container}>

      {sections.map((sec, index) => (
        <section
          key={index}

          className={styles.section}
          style={{
            backgroundImage: `url(${sec.image})`,
          }}
        />
      ))}

    </div>
  );
}