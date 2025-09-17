import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Project Manager</h1>
        <p className="mb-8 text-xl text-muted-foreground">Create and manage your video projects</p>
        <Link to="/create-project">
          <Button size="lg">Create New Project</Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;
