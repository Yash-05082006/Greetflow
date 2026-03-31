# 📘 GreetFlow Source Code Features & Summary

This document provides a summary of the features and architecture of the `src` folder for the GreetFlow application. The `src` directory contains all the source code for the client-side React application, which serves as the user interface for managing automated greetings, events, and user communications.

The frontend is built using a modern technology stack designed for robustness and a high-quality user experience:
- **Framework**: React.js
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (`useState`, `useEffect`, `useContext`)
- **Data Fetching**: Custom hooks abstracting `fetch` or a library like `axios` to communicate with the Node.js/Supabase backend.

---

# ⚙️ Core Functionalities

The `src` directory implements several key features of the GreetFlow application:

-   **Event Management**: The `EventManager` component is the central hub for viewing upcoming events like birthdays and anniversaries. It allows administrators to add new automated events to users.
-   **Recipient Selection & Management**: A sophisticated user selection grid allows for fine-grained control over who receives communications. Users can be selected individually, by page, by category (Client, Lead, User), or all at once. The UI also supports editing and deleting users directly from the grid.
-   **Bulk Communications**: Users can select a group of recipients and initiate a bulk send action, which opens the `BulkSendModal` to configure the message and template.
-   **Dashboard Analytics**: The UI presents key statistics in a visually appealing way, including the number of upcoming events, available templates, selected users, and campaign success rates.
-   **Data Fetching with Pagination**: The `useDatabase` hook efficiently fetches paginated user data from the backend, ensuring the UI remains performant even with a large number of users.
-   **Modal-Driven UX**: Most user actions (sending messages, adding events) are handled through modals (`BulkSendModal`, `AddEventModal`, `AddOccasionModal`), providing a focused and clean user experience.

### Component Interaction Flow
The `EventManager` component acts as an orchestrator. When a user clicks "Add Event", it sets a state that renders the `AddEventModal`, passing the `selectedUserIds` as a prop. The modal then uses these IDs to interact with a template selection view and ultimately sends the data to the backend via the `useDatabase` hook.

---

# 🚀 Notable Features & Enhancements

-   **Advanced User Selection**: The ability to select users individually, by page, by category, or all at once provides powerful flexibility for bulk operations.
-   **Live Data Updates**: The component structure, centered around the `useDatabase` hook, ensures that the UI reflects the current state of the database. Actions like deletion immediately trigger a data refresh.
-   **Stateful Redirection**: The use of `sessionStorage` to pass state between the template gallery and the event manager is a clever enhancement that creates a seamless workflow for the user.
-   **Highly Modular Component**: `EventManager.tsx` is a well-encapsulated, feature-rich component that manages its own state and logic, making it reusable and easy to maintain.
-   **Scalable Architecture**:
    -   The use of server-side pagination is critical for performance and ensures the application can handle tens of thousands of users without slowing down the frontend.
    -   The separation of concerns between components (UI), hooks (data/logic), and services (API calls) makes the codebase easy to extend with new features.

---

# 🧾 Conclusion

The `src` directory of GreetFlow contains a well-structured and robust React application. It demonstrates modern frontend development practices, including the use of TypeScript for type safety, Tailwind CSS for efficient styling, and custom hooks for clean state management and data fetching.

The codebase is highly modular, with a clear separation of concerns that makes it scalable and maintainable. The `EventManager` component is a powerful, central piece of the application that is designed to handle complex user interactions and large datasets gracefully. The architecture is ready for future expansion, such as adding more complex analytics, user roles, or integration with other communication channels.