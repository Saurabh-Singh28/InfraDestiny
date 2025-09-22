import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import BudgetProgress from '@/components/dashboard/BudgetProgress';
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Expense {
  id: string;
  amount: number;
  description: string;
  merchant: string;
  expense_date: string;
  categories: {
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  color: string;
  monthly_budget: number;
  icon: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch expenses for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          merchant,
          expense_date,
          categories (
            name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .gte('expense_date', startOfMonth.toISOString().split('T')[0])
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (categoriesError) throw categoriesError;

      setExpenses(expensesData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const transactionCount = expenses.length;
  const avgTransactionAmount = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Prepare chart data
  const categoryExpenses = expenses.reduce((acc, expense) => {
    const categoryName = expense.categories?.name || 'Other';
    const categoryColor = expense.categories?.color || '#6B7280';
    
    if (!acc[categoryName]) {
      acc[categoryName] = { amount: 0, color: categoryColor };
    }
    acc[categoryName].amount += Number(expense.amount);
    return acc;
  }, {} as Record<string, { amount: number; color: string }>);

  const chartData = Object.entries(categoryExpenses).map(([name, data]) => ({
    name,
    value: data.amount,
    color: data.color,
  }));

  // Prepare budget progress data
  const budgetData = categories.map(category => {
    const spent = categoryExpenses[category.name]?.amount || 0;
    return {
      id: category.id,
      name: category.name,
      spent,
      budget: Number(category.monthly_budget),
      color: category.color,
    };
  });

  const totalBudget = categories.reduce((sum, cat) => sum + Number(cat.monthly_budget), 0);
  const budgetRemaining = totalBudget - totalSpent;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Track your spending and manage your budget</p>
          </div>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Spent"
            value={`$${totalSpent.toLocaleString()}`}
            description="This month"
            icon={DollarSign}
            variant={totalSpent > totalBudget ? 'danger' : 'default'}
          />
          <StatsCard
            title="Transactions"
            value={transactionCount.toString()}
            description="This month"
            icon={CreditCard}
          />
          <StatsCard
            title="Average per Transaction"
            value={`$${avgTransactionAmount.toLocaleString()}`}
            description="This month"
            icon={TrendingUp}
          />
          <StatsCard
            title="Budget Remaining"
            value={`$${budgetRemaining.toLocaleString()}`}
            description={`of $${totalBudget.toLocaleString()}`}
            icon={Calendar}
            variant={budgetRemaining < 0 ? 'danger' : budgetRemaining < totalBudget * 0.2 ? 'warning' : 'success'}
          />
        </div>

        {/* Charts and Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ExpenseChart data={chartData} />
          <BudgetProgress budgets={budgetData} />
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No transactions this month. Start by adding your first expense!
              </div>
            ) : (
              <div className="space-y-4">
                {expenses.slice(0, 5).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: expense.categories?.color || '#6B7280' }}
                      />
                      <div>
                        <div className="font-medium">{expense.description || expense.merchant}</div>
                        <div className="text-sm text-muted-foreground">
                          {expense.categories?.name} • {new Date(expense.expense_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${Number(expense.amount).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                {expenses.length > 5 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All Transactions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
