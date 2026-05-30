/**
 * @velonix/ui
 *
 * Shared UI primitives built on Radix UI, styled with the Velonix
 * dark gaming theme. Import these in apps/web or any future app.
 *
 * All components are unstyled Radix primitives composed with
 * Velonix Tailwind classes. They require tailwind.config.ts from
 * apps/web (or a consumer that sets up the same CSS variables).
 */

// Dialogs
export {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogClose,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "./Dialog";

// Tooltips
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./Tooltip";

// Dropdown Menus
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup,
  DropdownMenuSub, DropdownMenuPortal,
} from "./DropdownMenu";

// Progress
export { Progress } from "./Progress";
export type { ProgressProps } from "./Progress";
