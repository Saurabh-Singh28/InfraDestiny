import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BudgetItem {
  id: string;
  name: string;
  spent: number;
  budget: number;
  color: string;
}

interface BudgetProgressProps {
  budgets: BudgetItem[];
}

export default function BudgetProgress({ budgets }: BudgetProgressProps) {
  const getBudgetStatus = (spent: number, budget: number) => {
    if (budget === 0) return { variant: 'default', icon: null, text: 'No budget set' };
    
    const percentage = (spent / budget) * 100;
    
    if (percentage >= 100) {
      return { 
        variant: 'danger' as const, 
        icon: XCircle, 
        text: 'Over budget',
        percentage: Math.min(percentage, 150) // Cap at 150% for visual purposes
      };
    } else if (percentage >= 80) {
      return { 
        variant: 'warning' as const, 
        icon: AlertTriangle, 
        text: 'Near limit',
        percentage
      };
    } else {
      return { 
        variant: 'success' as const, 
        icon: CheckCircle, 
        text: 'On track',
        percentage
      };
    }
  };

  const getProgressColor = (variant: string) => {
    switch (variant) {
      case 'success':
        return 'bg-budget-safe';
      case 'warning':
        return 'bg-budget-warning';
      case 'danger':
        return 'bg-budget-danger';
      default:
        return 'bg-primary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No budget data available
          </div>
        ) : (
          budgets.map((budget) => {
            const status = getBudgetStatus(budget.spent, budget.budget);
            const StatusIcon = status.icon;
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: budget.color }}
                    />
                    <span className="font-medium">{budget.name}</span>
                    {StatusIcon && (
                      <StatusIcon className={`h-4 w-4 ${
                        status.variant === 'success' ? 'text-budget-safe' :
                        status.variant === 'warning' ? 'text-budget-warning' :
                        'text-budget-danger'
                      }`} />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      ${budget.spent.toLocaleString()} / ${budget.budget.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {status.text}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={status.percentage || 0} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>{Math.round(status.percentage || 0)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
