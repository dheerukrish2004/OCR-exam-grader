import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

export default function Navbar() {
  return (
    <nav className="nav">
      <img src={logo} className="logo" />
      <div>
        <Link to="/">Home</Link>
        <Link to="/services">Services</Link>
      </div>
    </nav>
  );
}
