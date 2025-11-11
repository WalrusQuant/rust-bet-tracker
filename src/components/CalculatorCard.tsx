import { NavLink } from "@/components/NavLink";
import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CalculatorCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
}

const CalculatorCard = ({ title, description, icon: Icon, link }: CalculatorCardProps) => {
  return (
    <NavLink to={link} className="group">
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary">
        <CardHeader>
          <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </NavLink>
  );
};

export default CalculatorCard;
