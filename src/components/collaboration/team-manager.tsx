'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import {
  Users,
  Plus,
  Settings,
  Crown,
  Shield,
  User,
  Eye,
  Mail,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import type { Team, TeamMember } from '@/types/collaboration';

interface TeamManagerProps {
  className?: string;
}

export default function TeamManager({ className }: TeamManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await apiClient.get('/api/teams', {
        enableCache: true,
        cacheTTL: 300000, // 5 minutes cache
      });
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    if (!newTeamName.trim()) return;

    setCreatingTeam(true);
    try {
      const team = await apiClient.post('/api/teams', { 
        name: newTeamName.trim(), 
        description: newTeamDescription.trim() || undefined 
      });
      setTeams(prev => [team, ...prev]);
      setNewTeamName('');
      setNewTeamDescription('');
      setShowCreateDialog(false);
      toast({
        title: 'Team created',
        description: `Team "${newTeamName}" has been created successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setCreatingTeam(false);
    }
  };

  const deleteTeam = async () => {
    if (!selectedTeam) return;

    setDeletingTeam(true);
    try {
      await apiClient.delete(`/api/teams/${selectedTeam.id}`);
      setTeams(prev => prev.filter(team => team.id !== selectedTeam.id));
      setShowDeleteDialog(false);
      setSelectedTeam(null);
      toast({
        title: 'Team deleted',
        description: `Team "${selectedTeam.name}" has been deleted successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete team',
        variant: 'destructive',
      });
    } finally {
      setDeletingTeam(false);
    }
  };

  const addMember = async () => {
    if (!selectedTeam || !newMemberEmail.trim()) return;

    setAddingMember(true);
    try {
      const newMember = await apiClient.post(`/api/teams/${selectedTeam.id}/members`, { 
        email: newMemberEmail.trim(), 
        role: newMemberRole 
      });
      setTeams(prev => prev.map(team => 
        team.id === selectedTeam.id 
          ? { ...team, members: [...team.members, newMember] }
          : team
      ));
      setNewMemberEmail('');
      setNewMemberRole('member');
      setShowAddMemberDialog(false);
      setSelectedTeam(null);
      toast({
        title: 'Member invited',
        description: `Invitation sent to ${newMemberEmail}. They will receive an email notification.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to invite member',
        variant: 'destructive',
      });
    } finally {
      setAddingMember(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member':
        return <User className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'member':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Teams</span>
            <Badge variant="outline">{teams.length}</Badge>
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="Enter team name"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (Optional)</Label>
                  <Textarea
                    id="team-description"
                    placeholder="Enter team description"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createTeam} disabled={!newTeamName.trim() || creatingTeam}>
                  {creatingTeam ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Team'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Teams Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first team to collaborate on vulnerability research
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <Card key={team.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {team.name}
                        </h3>
                        <Badge variant="outline">
                          {team.members.length} members
                        </Badge>
                      </div>
                      
                      {team.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {team.description}
                        </p>
                      )}

                      {/* Team Members */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Members:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {team.members.slice(0, 5).map((member) => (
                            <div
                              key={member.userId}
                              className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                                  {member.displayName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {member.displayName}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getRoleColor(member.role)}`}
                              >
                                {getRoleIcon(member.role)}
                                <span className="ml-1">{member.role}</span>
                              </Badge>
                            </div>
                          ))}
                          {team.members.length > 5 && (
                            <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                              <span className="text-sm text-gray-500">
                                +{team.members.length - 5} more
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mt-3">
                        Created: {new Date(team.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAddMemberDialog(true);
                        }}
                        title="Add member"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete team"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-email">Email Address</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="user@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Select value={newMemberRole} onValueChange={(value: 'admin' | 'member' | 'viewer') => setNewMemberRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addMember} disabled={!newMemberEmail.trim() || addingMember}>
              {addingMember ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Team Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete the team "{selectedTeam?.name}"? This action cannot be undone.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> All team data, discussions, and shared vulnerabilities will be permanently deleted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTeam} disabled={deletingTeam}>
              {deletingTeam ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Team'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
