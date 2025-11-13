import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Trash2, Plus, X, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Tag {
  id: string;
  name: string;
  bet_count?: number;
}

const TagManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sportsbooks, setSportsbooks] = useState<Tag[]>([]);
  const [leagues, setLeagues] = useState<Tag[]>([]);
  const [betTypes, setBetTypes] = useState<Tag[]>([]);
  const [strategies, setStrategies] = useState<Tag[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState<'sportsbook' | 'league' | 'betType' | 'strategy' | null>(null);

  const [newSportsbook, setNewSportsbook] = useState('');
  const [newLeague, setNewLeague] = useState('');
  const [newBetType, setNewBetType] = useState('');
  const [newStrategy, setNewStrategy] = useState('');

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'sportsbook' | 'league' | 'betType' | 'strategy' | null;
    id: string | null;
    name: string;
    betCount: number;
  }>({
    open: false,
    type: null,
    id: null,
    name: '',
    betCount: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAllTags();
  }, [user, navigate]);

  const fetchAllTags = async () => {
    await Promise.all([fetchSportsbooks(), fetchLeagues(), fetchBetTypes(), fetchStrategies()]);
  };

  const fetchSportsbooks = async () => {
    try {
      const { data: sportsbooksData, error: sportsbooksError } = await supabase
        .from('sportsbooks')
        .select('*')
        .order('name');

      if (sportsbooksError) throw sportsbooksError;

      // Get bet counts for each sportsbook
      const sportsbooksWithCounts = await Promise.all(
        (sportsbooksData || []).map(async (sb) => {
          const { count } = await supabase
            .from('bets')
            .select('*', { count: 'exact', head: true })
            .eq('sportsbook_id', sb.id);
          return { ...sb, bet_count: count || 0 };
        })
      );

      setSportsbooks(sportsbooksWithCounts);
    } catch (error) {
      console.error('Failed to fetch sportsbooks:', error);
    }
  };

  const fetchLeagues = async () => {
    try {
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('*')
        .order('name');

      if (leaguesError) throw leaguesError;

      const leaguesWithCounts = await Promise.all(
        (leaguesData || []).map(async (league) => {
          const { count } = await supabase
            .from('bets')
            .select('*', { count: 'exact', head: true })
            .eq('league_id', league.id);
          return { ...league, bet_count: count || 0 };
        })
      );

      setLeagues(leaguesWithCounts);
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
    }
  };

  const fetchBetTypes = async () => {
    try {
      const { data: betTypesData, error: betTypesError } = await supabase
        .from('bet_types')
        .select('*')
        .order('name');

      if (betTypesError) throw betTypesError;

      const betTypesWithCounts = await Promise.all(
        (betTypesData || []).map(async (type) => {
          const { count } = await supabase
            .from('bets')
            .select('*', { count: 'exact', head: true })
            .eq('bet_type_id', type.id);
          return { ...type, bet_count: count || 0 };
        })
      );

      setBetTypes(betTypesWithCounts);
    } catch (error) {
      console.error('Failed to fetch bet types:', error);
    }
  };

  const fetchStrategies = async () => {
    try {
      const { data: strategiesData, error: strategiesError } = await (supabase as any)
        .from('strategies')
        .select('*')
        .order('name');

      if (strategiesError) throw strategiesError;

      const strategiesWithCounts = await Promise.all(
        (strategiesData || []).map(async (strategy: any) => {
          const { count } = await (supabase as any)
            .from('bet_strategies')
            .select('*', { count: 'exact', head: true })
            .eq('strategy_id', strategy.id);
          return { ...strategy, bet_count: count || 0 };
        })
      );

      setStrategies(strategiesWithCounts as Tag[]);
    } catch (error) {
      console.error('Failed to fetch strategies:', error);
    }
  };

  const handleAdd = async (type: 'sportsbook' | 'league' | 'betType' | 'strategy', name: string) => {
    if (!user || !name.trim()) return;

    const tableName = type === 'sportsbook' ? 'sportsbooks' : type === 'league' ? 'leagues' : type === 'betType' ? 'bet_types' : 'strategies';

    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .insert({ user_id: user.id, name: name.trim() });

      if (error) throw error;

      const displayName = type === 'sportsbook' ? 'Sportsbook' : type === 'league' ? 'League' : type === 'betType' ? 'Bet type' : 'Strategy';
      toast({ title: 'Success', description: `${displayName} added successfully` });

      // Clear input and refresh
      if (type === 'sportsbook') setNewSportsbook('');
      else if (type === 'league') setNewLeague('');
      else if (type === 'betType') setNewBetType('');
      else setNewStrategy('');

      fetchAllTags();
    } catch (error) {
      toast({ title: 'Error', description: `Failed to add ${type}`, variant: 'destructive' });
    }
  };

  const startEdit = (type: 'sportsbook' | 'league' | 'betType' | 'strategy', id: string, name: string) => {
    setEditingType(type);
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEdit = () => {
    setEditingType(null);
    setEditingId(null);
    setEditingName('');
  };

  const handleUpdate = async () => {
    if (!editingId || !editingType || !editingName.trim()) return;

    const tableName = editingType === 'sportsbook' ? 'sportsbooks' : editingType === 'league' ? 'leagues' : editingType === 'betType' ? 'bet_types' : 'strategies';

    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .update({ name: editingName.trim() })
        .eq('id', editingId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Tag updated successfully' });
      cancelEdit();
      fetchAllTags();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update tag', variant: 'destructive' });
    }
  };

  const openDeleteDialog = (type: 'sportsbook' | 'league' | 'betType' | 'strategy', id: string, name: string, betCount: number) => {
    setDeleteDialog({
      open: true,
      type,
      id,
      name,
      betCount,
    });
  };

  const handleDelete = async () => {
    if (!deleteDialog.id || !deleteDialog.type) return;

    const tableName = deleteDialog.type === 'sportsbook' ? 'sportsbooks' : deleteDialog.type === 'league' ? 'leagues' : deleteDialog.type === 'betType' ? 'bet_types' : 'strategies';

    try {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', deleteDialog.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Tag deleted successfully' });
      setDeleteDialog({ open: false, type: null, id: null, name: '', betCount: 0 });
      fetchAllTags();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete tag', variant: 'destructive' });
    }
  };

  const renderTagTable = (
    tags: Tag[],
    type: 'sportsbook' | 'league' | 'betType' | 'strategy',
    newValue: string,
    setNewValue: (value: string) => void
  ) => {
    const displayName = type === 'sportsbook' ? 'Sportsbooks' : type === 'league' ? 'Sports/Leagues' : type === 'betType' ? 'Bet Types' : 'Strategies';
    const singularName = type === 'sportsbook' ? 'sportsbook' : type === 'league' ? 'sport/league' : type === 'betType' ? 'bet type' : 'strategy';
    
    return (
    <Card>
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        <CardDescription>
          Manage your {singularName} tags
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            placeholder={`Add new ${singularName}...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAdd(type, newValue);
              }
            }}
          />
          <Button onClick={() => handleAdd(type, newValue)}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Bets</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No tags yet. Add one above.
                </TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    {editingId === tag.id && editingType === type ? (
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleUpdate}>
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit}>
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{tag.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{tag.bet_count || 0}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId !== tag.id && (
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(type, tag.id, tag.name)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(type, tag.id, tag.name, tag.bet_count || 0)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>Please sign in to manage your tags.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Tag Management</h1>
          <p className="text-muted-foreground">
            Organize and manage your sportsbooks, leagues, and bet type tags
          </p>
        </div>

        <div className="space-y-6">
          {renderTagTable(sportsbooks, 'sportsbook', newSportsbook, setNewSportsbook)}
          {renderTagTable(leagues, 'league', newLeague, setNewLeague)}
          {renderTagTable(betTypes, 'betType', newBetType, setNewBetType)}
          {renderTagTable(strategies, 'strategy', newStrategy, setNewStrategy)}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteDialog.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDialog.betCount > 0 ? (
                  <>
                    This tag is currently used in <strong>{deleteDialog.betCount}</strong> bet{deleteDialog.betCount !== 1 ? 's' : ''}.
                    Deleting it will remove the tag from all those bets. This action cannot be undone.
                  </>
                ) : (
                  'This action cannot be undone. The tag will be permanently deleted.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TagManagement;
