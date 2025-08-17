export default function Hero() {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <img
        src="/chair.png"
        alt="Chair"
        style={{ maxWidth: '300px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}
      />
      <p style={{
        marginTop: '20px',
        fontSize: '12px',
        backgroundColor: '#888',
        display: 'inline-block',
        padding: '5px 10px',
        borderRadius: '5px',
        color: 'white',
        height: '10vh',
      }}>
        CLICK THE BANNER TO REGISTER
      </p>
    </div>
  );
}
