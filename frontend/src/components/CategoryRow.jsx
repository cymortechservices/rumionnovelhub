import { Link } from "react-router-dom";
import NovelCard from "./NovelCard";
import "./CategoryRow.css";

export default function CategoryRow({ title, novels, viewAllTo, source = "original" }) {
  if (!novels?.length) return null;
  return (
    <section className="category-row">
      <div className="category-row__head">
        <h3 className="font-display">{title}</h3>
        {viewAllTo && <Link to={viewAllTo} className="category-row__more">See all</Link>}
      </div>
      <div className="category-row__scroller">
        {novels.map((n) => (
          <NovelCard key={source === "external" ? n.id : n._id} novel={n} source={source} />
        ))}
      </div>
    </section>
  );
}
