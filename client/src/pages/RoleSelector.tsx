import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Gauge } from "lucide-react";

interface RoleSelectorProps {
  onSelectRole: (role: "spectator" | "staff" | "organizer") => void;
}

export default function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-chart-2/10">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gauge className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">EventFlow</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Entertainment Center Management Platform
          </p>
          <p className="text-sm text-muted-foreground">
            Select your role to continue
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover-elevate transition-all cursor-pointer" onClick={() => onSelectRole("spectator")}>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-chart-5/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-chart-5" />
              </div>
              <h3 className="text-xl font-bold">Spectator</h3>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                View your ticket, navigate the venue, and receive event updates
              </p>
              <Button className="w-full" data-testid="button-role-spectator">
                Enter as Spectator
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all cursor-pointer" onClick={() => onSelectRole("staff")}>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-[hsl(142,70%,45%)]/10 flex items-center justify-center mb-4">
                <UserCheck className="h-8 w-8 text-[hsl(142,70%,45%)]" />
              </div>
              <h3 className="text-xl font-bold">Staff</h3>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Scan tickets, monitor entrances, and manage crowd flow
              </p>
              <Button className="w-full" data-testid="button-role-staff">
                Enter as Staff
              </Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate transition-all cursor-pointer" onClick={() => onSelectRole("organizer")}>
            <CardHeader className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Gauge className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Organizer</h3>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Access analytics, AI recommendations, and full event control
              </p>
              <Button className="w-full" data-testid="button-role-organizer">
                Enter as Organizer
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>Demo mode - All roles available for exploration</p>
        </div>
      </div>
    </div>
  );
}
