import SearchBar from "../../components/searchBar/SearchBar";
import "./home.scss";

const Home = () => {
  return (
    <div className="homePage">
      <div className="textContainer">
        <div className="wrapper">
          <h1 className="title">Journey To Your Perfect Home</h1>
          <p>
            Embark on a journey to find a home that reflects your dreams and
            lifestyle. Explore curated listings designed to meet your unique
            needs, bringing you one step closer to the perfect place to call
            home.
          </p>
          <SearchBar />
          <div className="boxes">
            <div className="box">
              <h1>16+</h1>
              <h2>Years of Experience</h2>
            </div>
            <div className="box">
              <h1>200</h1>
              <h2>Award Gained</h2>
            </div>
            <div className="box">
              <h1>2000+</h1>
              <h2>Property Ready</h2>
            </div>
          </div>
        </div>
      </div>
      <div className="imgContainer">
        <img src="/images/bg.png" alt="homePageImage" />
      </div>
    </div>
  );
};

export default Home;
