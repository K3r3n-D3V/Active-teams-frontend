import React  from "react";
import styles from "../styles/Header.module.css";

export default function Home() {


  const sections = [
    { image: "/imagenumberone.jpeg" },
    { image: "/imagenumbertwo.jpeg" },
    { image: "/imagenumberthree.jpeg" },
    { image: "/imagenumberfour.jpeg" },
    // { image: "/newimage.jpg" }, 
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