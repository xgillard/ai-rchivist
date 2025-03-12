import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppWithId from './routes/app_with_id';
import PickRandomUnvalidated, {loader as FindAny, CouldNotFindDocumentToAnnotate} from './routes/pick_random_unvalidated';

function App() {
  const router = createBrowserRouter([
    {path: "/annotate/:id/*", element: <AppWithId /> },
    {path: "*",               element: <PickRandomUnvalidated />, loader: FindAny, errorElement: <CouldNotFindDocumentToAnnotate /> },
  ]);
    
  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
