'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';
import type { Team, TeamMember } from '@/types/collaboration';

interface TeamManagerProps {
  className?: string;
}

export default function TeamManager({ className }: TeamManagerProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async () => {
    const name = prompt('Enter team name:');
    if (!name) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        const team = await response.json();
        setTeams(prev => [team, ...prev]);
        toast({
          title: 'Team created',
          description: `Team "${name}" has been created successfully`,
        });
      } else {
        throw new Error('Failed to create team');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
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
          <Button size="sm" onClick={createTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
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
            <Button onClick={createTeam}>
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
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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
    </Card>
  );
}
