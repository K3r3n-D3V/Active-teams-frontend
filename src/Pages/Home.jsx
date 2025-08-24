import React from 'react'
import Hero from '../components/Hero'
import Header from '../components/Header'

const Home = () => {
  return (
    <div>

      <div style={{ marginBottom: "40px" }}>
        <Header />
      </div>
      <div style={{ marginBottom: "60px", position: 'relative', zIndex: 1 }}>
        <Hero />
      </div>


      <div
        style={{
          position: 'relative',
          top: '-40px',   
          marginBottom: '40px',
          zIndex: 2,     
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',  
          borderRadius: '10px', 
          overflow: 'hidden', 
        }}
      >
   
      </div>
    </div>
  );
};

export default Home;
