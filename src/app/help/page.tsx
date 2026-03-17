export default function HelpPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold tracking-tight">
        Instructions / Help
      </h2>
      <p className="text-sm text-slate-300 text-justify">
        Outlands Group Finder is a tool to form pick-up groups for in-game activities in Ultima Online Outlands.
      </p>
      <p className="text-sm text-slate-300 text-justify">
        To interact with the tool, you need to be logged in with your Discord account.
      </p>
      <p className="text-sm text-slate-300 text-justify">
        To look for more players for a certain activity, create a new group. Select the type of group you want to create and, if you want to, add a description to further specify what you are looking for. A description is mandatory for some group types. Some might require you to choose a role you want to fulfill.
      </p>
      <p className="text-sm text-slate-300 text-justify">
        Alternatively, you may browse the list of available groups that other players have allready created and apply to join them. You can filter the list by group types. Again, some group types may require you to choose a role. You may only apply to up to 5 groups at a time.
      </p>
      <p className="text-sm text-slate-300 text-justify">
        If your application to join a group is accepted, you will become a member of that group, clearing all other applications, you may had submitted. You can only ever be a member of one group at a time and while you are, you can't apply to join other groups.
      </p>
      <p className="text-sm text-slate-300 text-justify">
        As the creator of a group (indicated by the ♔ symbol), you can accept or decline applicants. You can also make the group temporarily unavailable, declining all current applicants and hiding it from the list of available groups. Groups will be deleted automatically after 1 hour of its creator's last interaction, indicated by a timer. Clicking the timer manually resets it.
      </p>
      <p className="text-sm text-slate-300 text-justify">
        All changes are automatically broadcasted to all active users immidiately, so you don't need to refresh the page manually to see updated listings.
      </p>
    </div>
  );
}
