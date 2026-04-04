import "../sass/components/footer.scss";

function Footer() {
  const currentYear = new Date().getFullYear();
  return <footer className="footer">TKM @ {currentYear}</footer>;
}

export default Footer;
