import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, X, Users, Utensils, Brush, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface HouseholdMember {
  id: number;
  name: string;
  age?: number;
  dietaryRestrictions: string[];
  allergies: string[];
  preferences: string[];
  dislikes: string[];
}

interface CookingEquipment {
  id: number;
  name: string;
  type: string;
  brand?: string;
}

export default function HouseholdSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMember, setNewMember] = useState<Partial<HouseholdMember>>({
    name: '',
    age: undefined,
    dietaryRestrictions: [],
    allergies: [],
    preferences: [],
    dislikes: []
  });
  const [newEquipment, setNewEquipment] = useState<Partial<CookingEquipment>>({
    name: '',
    type: '',
    brand: ''
  });
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);

  const { data: householdMembers, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/household-members"],
    enabled: !!user,
  });

  const { data: cookingEquipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ["/api/cooking-equipment"],
    enabled: !!user,
  });

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: Partial<HouseholdMember>) => {
      await apiRequest("POST", "/api/household-members", memberData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/household-members"] });
      setNewMember({
        name: '',
        age: undefined,
        dietaryRestrictions: [],
        allergies: [],
        preferences: [],
        dislikes: []
      });
      toast({
        title: "Success",
        description: "Household member added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add household member",
        variant: "destructive",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<HouseholdMember> }) => {
      await apiRequest("PUT", `/api/household-members/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/household-members"] });
      setEditingMember(null);
      toast({
        title: "Success",
        description: "Household member updated successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update household member",
        variant: "destructive",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/household-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/household-members"] });
      toast({
        title: "Success",
        description: "Household member deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete household member",
        variant: "destructive",
      });
    },
  });

  const createEquipmentMutation = useMutation({
    mutationFn: async (equipmentData: Partial<CookingEquipment>) => {
      await apiRequest("POST", "/api/cooking-equipment", equipmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking-equipment"] });
      setNewEquipment({ name: '', type: '', brand: '' });
      toast({
        title: "Success",
        description: "Cooking equipment added successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add cooking equipment",
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cooking-equipment/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cooking-equipment"] });
      toast({
        title: "Success",
        description: "Cooking equipment deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete cooking equipment",
        variant: "destructive",
      });
    },
  });

  const handleAddTag = (field: keyof HouseholdMember, value: string, isEditing = false) => {
    if (!value.trim()) return;
    
    const target = isEditing ? editingMember : newMember;
    const setter = isEditing ? setEditingMember : setNewMember;
    
    if (target && Array.isArray(target[field])) {
      const currentTags = target[field] as string[];
      if (!currentTags.includes(value.trim())) {
        setter({
          ...target,
          [field]: [...currentTags, value.trim()]
        });
      }
    }
  };

  const handleRemoveTag = (field: keyof HouseholdMember, tag: string, isEditing = false) => {
    const target = isEditing ? editingMember : newMember;
    const setter = isEditing ? setEditingMember : setNewMember;
    
    if (target && Array.isArray(target[field])) {
      const currentTags = target[field] as string[];
      setter({
        ...target,
        [field]: currentTags.filter(t => t !== tag)
      });
    }
  };

  const handleSubmitMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name?.trim()) return;
    
    createMemberMutation.mutate(newMember);
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember?.id) return;
    
    updateMemberMutation.mutate({
      id: editingMember.id,
      updates: editingMember
    });
  };

  const handleSubmitEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEquipment.name?.trim() || !newEquipment.type?.trim()) return;
    
    createEquipmentMutation.mutate(newEquipment);
  };

  const equipmentTypes = [
    "slow_cooker",
    "instant_pot",
    "air_fryer",
    "rice_cooker",
    "blender",
    "food_processor",
    "stand_mixer",
    "pressure_cooker",
    "grill",
    "smoker",
    "toaster_oven",
    "microwave",
    "other"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center">
                <Utensils className="h-8 w-8 text-primary mr-3" />
                <h1 className="text-xl font-bold text-gray-900">Household Setup</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Family Members</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center space-x-2">
              <Brush className="h-4 w-4" />
              <span>Cooking Equipment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Add New Member */}
            <Card>
              <CardHeader>
                <CardTitle>Add Family Member</CardTitle>
                <CardDescription>
                  Add family members to create personalized meal plans that work for everyone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={newMember.name || ''}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age (optional)</Label>
                      <Input
                        id="age"
                        type="number"
                        value={newMember.age || ''}
                        onChange={(e) => setNewMember({ ...newMember, age: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="Enter age"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Dietary Restrictions */}
                    <div>
                      <Label>Dietary Restrictions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newMember.dietaryRestrictions?.map(restriction => (
                          <Badge key={restriction} variant="secondary" className="cursor-pointer">
                            {restriction}
                            <X 
                              className="h-3 w-3 ml-1" 
                              onClick={() => handleRemoveTag('dietaryRestrictions', restriction)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex mt-2">
                        <Input
                          placeholder="Add dietary restriction (e.g., vegetarian, gluten-free)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag('dietaryRestrictions', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Allergies */}
                    <div>
                      <Label>Allergies</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newMember.allergies?.map(allergy => (
                          <Badge key={allergy} variant="destructive" className="cursor-pointer">
                            {allergy}
                            <X 
                              className="h-3 w-3 ml-1" 
                              onClick={() => handleRemoveTag('allergies', allergy)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex mt-2">
                        <Input
                          placeholder="Add allergy (e.g., nuts, dairy, shellfish)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag('allergies', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Preferences */}
                    <div>
                      <Label>Food Preferences</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newMember.preferences?.map(preference => (
                          <Badge key={preference} variant="outline" className="cursor-pointer">
                            {preference}
                            <X 
                              className="h-3 w-3 ml-1" 
                              onClick={() => handleRemoveTag('preferences', preference)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex mt-2">
                        <Input
                          placeholder="Add preference (e.g., spicy food, italian cuisine)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag('preferences', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Dislikes */}
                    <div>
                      <Label>Dislikes</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newMember.dislikes?.map(dislike => (
                          <Badge key={dislike} variant="outline" className="cursor-pointer border-red-200">
                            {dislike}
                            <X 
                              className="h-3 w-3 ml-1" 
                              onClick={() => handleRemoveTag('dislikes', dislike)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex mt-2">
                        <Input
                          placeholder="Add dislike (e.g., mushrooms, seafood)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag('dislikes', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createMemberMutation.isPending}
                  >
                    {createMemberMutation.isPending ? "Adding..." : "Add Family Member"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Members */}
            <Card>
              <CardHeader>
                <CardTitle>Family Members</CardTitle>
                <CardDescription>
                  Manage your household members and their preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : householdMembers?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No family members added yet. Add your first member above.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {householdMembers?.map((member: HouseholdMember) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{member.name}</h3>
                            {member.age && (
                              <Badge variant="outline">{member.age} years old</Badge>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingMember(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteMemberMutation.mutate(member.id)}
                              disabled={deleteMemberMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {member.dietaryRestrictions?.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Dietary Restrictions: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.dietaryRestrictions.map(restriction => (
                                  <Badge key={restriction} variant="secondary" className="text-xs">
                                    {restriction}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {member.allergies?.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Allergies: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.allergies.map(allergy => (
                                  <Badge key={allergy} variant="destructive" className="text-xs">
                                    {allergy}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {member.preferences?.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Preferences: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.preferences.map(preference => (
                                  <Badge key={preference} variant="outline" className="text-xs">
                                    {preference}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {member.dislikes?.length > 0 && (
                            <div>
                              <span className="text-sm font-medium">Dislikes: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.dislikes.map(dislike => (
                                  <Badge key={dislike} variant="outline" className="text-xs border-red-200">
                                    {dislike}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-6">
            {/* Add New Equipment */}
            <Card>
              <CardHeader>
                <CardTitle>Add Cooking Equipment</CardTitle>
                <CardDescription>
                  Tell us about your kitchen equipment to get optimized recipes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEquipment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="equipment-name">Equipment Name</Label>
                      <Input
                        id="equipment-name"
                        value={newEquipment.name || ''}
                        onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                        placeholder="e.g., Instant Pot Duo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="equipment-type">Type</Label>
                      <Select 
                        value={newEquipment.type || ''}
                        onValueChange={(value) => setNewEquipment({ ...newEquipment, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="equipment-brand">Brand (optional)</Label>
                      <Input
                        id="equipment-brand"
                        value={newEquipment.brand || ''}
                        onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                        placeholder="e.g., Instant Pot"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createEquipmentMutation.isPending}
                  >
                    {createEquipmentMutation.isPending ? "Adding..." : "Add Equipment"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Existing Equipment */}
            <Card>
              <CardHeader>
                <CardTitle>Your Cooking Equipment</CardTitle>
                <CardDescription>
                  Equipment you can use for meal preparation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {equipmentLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : cookingEquipment?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No equipment added yet. Add your first item above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cookingEquipment?.map((equipment: CookingEquipment) => (
                      <div key={equipment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{equipment.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEquipmentMutation.mutate(equipment.id)}
                            disabled={deleteEquipmentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Badge variant="outline">
                            {equipment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          {equipment.brand && (
                            <p className="text-sm text-gray-600">{equipment.brand}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit Family Member</h3>
                <Button variant="ghost" size="sm" onClick={() => setEditingMember(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateMember} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editingMember.name || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-age">Age (optional)</Label>
                    <Input
                      id="edit-age"
                      type="number"
                      value={editingMember.age || ''}
                      onChange={(e) => setEditingMember({ ...editingMember, age: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Enter age"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Dietary Restrictions */}
                  <div>
                    <Label>Dietary Restrictions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingMember.dietaryRestrictions?.map(restriction => (
                        <Badge key={restriction} variant="secondary" className="cursor-pointer">
                          {restriction}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => handleRemoveTag('dietaryRestrictions', restriction, true)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add dietary restriction"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag('dietaryRestrictions', e.currentTarget.value, true);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <Label>Allergies</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingMember.allergies?.map(allergy => (
                        <Badge key={allergy} variant="destructive" className="cursor-pointer">
                          {allergy}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => handleRemoveTag('allergies', allergy, true)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add allergy"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag('allergies', e.currentTarget.value, true);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <Label>Food Preferences</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingMember.preferences?.map(preference => (
                        <Badge key={preference} variant="outline" className="cursor-pointer">
                          {preference}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => handleRemoveTag('preferences', preference, true)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add preference"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag('preferences', e.currentTarget.value, true);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Dislikes */}
                  <div>
                    <Label>Dislikes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingMember.dislikes?.map(dislike => (
                        <Badge key={dislike} variant="outline" className="cursor-pointer border-red-200">
                          {dislike}
                          <X 
                            className="h-3 w-3 ml-1" 
                            onClick={() => handleRemoveTag('dislikes', dislike, true)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex mt-2">
                      <Input
                        placeholder="Add dislike"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag('dislikes', e.currentTarget.value, true);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setEditingMember(null)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateMemberMutation.isPending}
                  >
                    {updateMemberMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
