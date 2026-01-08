import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "../ui/button";
import { ChevronUp } from "lucide-react";

export function UserNav() {
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');

  return (
    <DropdownMenu>
       <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-auto p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-3 w-full">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={userAvatar?.imageUrl} alt="User Avatar" data-ai-hint={userAvatar?.imageHint} />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="text-right group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium leading-none text-sidebar-foreground">ئەلێکس دۆ</p>
                    <p className="text-xs leading-none text-muted-foreground">بەڕێوەبەر</p>
                </div>
                <ChevronUp className="h-4 w-4 mr-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount dir="rtl">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">ئەلێکس دۆ</p>
            <p className="text-xs leading-none text-muted-foreground">
              alex.doe@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>پڕۆفایل</DropdownMenuItem>
          <DropdownMenuItem>پسوولە</DropdownMenuItem>
          <DropdownMenuItem>ڕێکخستنەکان</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          چوونەدەرەوە
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
