export const NAV_FOOTER = [
  {
    title: "Browse",
    links: [
      {
        label: "Apartments for rent",
        to: "/search?purpose=rent&type=apartment",
      },
      { label: "Homes for sale", to: "/search?purpose=buy" },
      { label: "Plots & land", to: "/search?type=plot,villa,farmhouse" },
      { label: "Commercial", to: "/search?type=commercial" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Neighbourhoods", to: "/areas" },
      { label: "Buildings", to: "/buildings" },
      { label: "Agencies", to: "/agencies" },
      { label: "Homes under ₹50L", to: "/search?purpose=buy&priceMax=5000000" },
    ],
  },
  {
    title: "Listers",
    links: [
      { label: "List a property", to: "/register?role=agent" },
      { label: "For landlords", to: "/register?role=landlord" },
      { label: "Agent dashboard", to: "/login" },
      { label: "Commute search", to: "/search?mode=commute" },
    ],
  },
];
