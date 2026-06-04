import { useSelector } from "react-redux";
import "../sass/components/footer.scss";

function Footer() {
  const currentYear = new Date().getFullYear();
  const { userInfo } = useSelector((state) => state.auth);

  return (
    <footer className={`footer ${userInfo ? "logged-in" : ""}`}>
      TKM @ {currentYear}
    </footer>
  );
}

export default Footer;
