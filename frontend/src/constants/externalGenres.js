// Real genre ids from the Nabees Novel API (GET /genre/{id}).
// Categories with no dedicated genre are derived:
//   action -> keyword search   |   18+ -> Modern Romance filtered by "Age Rating: 18+"
export const CATEGORIES = [
  { key: "action", label: "Action", search: "action" },
  { key: "romance", label: "Romance", genreId: 1002 },
  { key: "fantasy", label: "Fantasy", genreId: 1007 },
  { key: "eastern-fantasy", label: "Eastern Fantasy", genreId: 1006 },
  { key: "fiction", label: "Fiction", genreId: 1015 },
  { key: "urban", label: "Urban", genreId: 1008 },
  { key: "mystery", label: "Mystery", genreId: 1012 },
  { key: "sci-fi", label: "Sci-Fi", genreId: 1013 },
  { key: "horror", label: "Horror", genreId: 1011 },
  { key: "18+", label: "18+", genreId: 1002, adult: true },
];

export const categoryByKey = (key) => CATEGORIES.find((c) => c.key === key);
