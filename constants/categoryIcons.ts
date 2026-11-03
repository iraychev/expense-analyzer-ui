/** FontAwesome icon name for a transaction category. */
export const getCategoryIcon = (category: string): any => {
  switch (category) {
    case "Supermarkets":
      return "shopping-cart";
    case "Financial Services":
      return "bank";
    case "Shopping":
      return "shopping-bag";
    case "Restaurants and bars":
      return "cutlery";
    case "Entertainment and Sport":
      return "futbol-o";
    case "Traveling and Vacation":
      return "plane";
    case "Health and Beauty":
      return "heartbeat";
    default:
      return "question-circle";
  }
};
