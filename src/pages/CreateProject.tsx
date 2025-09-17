import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";

const formSchema = z.object({
  youtubeUrl: z.string().min(1, "YouTube URL is required").refine(
    (url) => {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      return youtubeRegex.test(url);
    },
    "Please enter a valid YouTube URL"
  ),
  projectType: z.string().min(1, "Project type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
});

type FormData = z.infer<typeof formSchema>;

interface Project {
  id: string;
  youtube_id: string;
  title: string;
  project_type: string;
  description: string;
  created_at: string;
}

const CreateProject = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: "",
      projectType: "",
      title: "",
      description: "",
    },
  });

  const editForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeUrl: "",
      projectType: "",
      title: "",
      description: "",
    },
  });

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch projects.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const extractYouTubeId = (url: string): string => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : "";
  };

  const buildYouTubeUrl = (youtubeId: string): string => {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const youtubeId = extractYouTubeId(data.youtubeUrl);
      
      const { error } = await supabase
        .from("projects")
        .insert({
          youtube_id: youtubeId,
          title: data.title,
          project_type: data.projectType,
          description: data.description,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Project created successfully.",
      });

      form.reset();
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    editForm.reset({
      youtubeUrl: buildYouTubeUrl(project.youtube_id),
      projectType: project.project_type,
      title: project.title,
      description: project.description,
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (data: FormData) => {
    if (!editingProject) return;
    
    setIsSubmitting(true);
    
    try {
      const youtubeId = extractYouTubeId(data.youtubeUrl);
      
      const { error } = await supabase
        .from("projects")
        .update({
          youtube_id: youtubeId,
          title: data.title,
          project_type: data.projectType,
          description: data.description,
        })
        .eq("id", editingProject.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Project updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingProject(null);
      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Project deleted successfully.",
      });

      fetchProjects(); // Refresh the list
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Create Project Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Plus className="h-6 w-6" />
              Create New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="youtubeUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select project type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ugc">UGC</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="educational">Educational</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                            <SelectItem value="corporate">Corporate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project title"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your project..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">All Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No projects yet. Create your first project above!
              </div>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="border-2">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{project.title}</h3>
                            <Badge variant="secondary" className="capitalize">
                              {project.project_type}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{project.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">YouTube:</span>
                            <a 
                              href={buildYouTubeUrl(project.youtube_id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {buildYouTubeUrl(project.youtube_id)}
                            </a>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(project)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{project.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(project.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="projectType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ugc">UGC</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="entertainment">Entertainment</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter project title"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Project"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateProject;