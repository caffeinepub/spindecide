import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Enforce user authentication on all public methods.
(with migration = Migration.run)
actor {
  // Inject access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ─── Types ───────────────────────────────────────────────────────────────

  public type WheelOption = {
    id : Text;
    optionLabel : Text;
    weight : Nat;
    color : ?Text;
    enabled : Bool;
  };

  public type Wheel = {
    id : Text;
    name : Text;
    options : [WheelOption];
    createdAt : Int;
    updatedAt : Int;
  };

  public type SpinEntry = {
    timestamp : Int;
    selectedLabel : Text;
    selectedWeight : Nat;
  };

  public type WheelInput = {
    name : Text;
    options : [WheelOption];
  };

  public type UserProfile = {
    name : Text;
  };

  // ─── State (stable in persistent actor) ──────────────────────────────

  let wheels : Map.Map<Text, Wheel> = Map.empty();
  let history : Map.Map<Text, [SpinEntry]> = Map.empty();
  let userProfiles : Map.Map<Principal, UserProfile> = Map.empty();

  // ─── Helpers ─────────────────────────────────────────────────────────────

  func makeKey(caller : Principal, wheelId : Text) : Text {
    caller.toText() # "#" # wheelId;
  };

  // ─── User Profile Functions ──────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ─── Wheel CRUD ───────────────────────────────────────────────────────────

  public shared ({ caller }) func createWheel(input : WheelInput) : async Wheel {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create wheels");
    };
    let now = Time.now();
    let id = now.toText() # "-" # caller.toText();
    let wheel : Wheel = {
      id;
      name = input.name;
      options = input.options;
      createdAt = now;
      updatedAt = now;
    };
    wheels.add(makeKey(caller, id), wheel);
    wheel;
  };

  public query ({ caller }) func getWheels() : async [Wheel] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access wheels");
    };
    let prefix = caller.toText() # "#";
    wheels.entries()
      .filter(func((k, _v) : (Text, Wheel)) : Bool { k.startsWith(#text prefix) })
      .map(func((_k, v) : (Text, Wheel)) : Wheel { v })
      .toArray();
  };

  public query ({ caller }) func getWheel(wheelId : Text) : async ?Wheel {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access wheels");
    };
    wheels.get(makeKey(caller, wheelId));
  };

  public shared ({ caller }) func updateWheel(wheelId : Text, input : WheelInput) : async ?Wheel {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update wheels");
    };
    let key = makeKey(caller, wheelId);
    switch (wheels.get(key)) {
      case null { null };
      case (?existing) {
        let updated : Wheel = {
          id = existing.id;
          name = input.name;
          options = input.options;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        wheels.add(key, updated);
        ?updated;
      };
    };
  };

  public shared ({ caller }) func deleteWheel(wheelId : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete wheels");
    };
    let key = makeKey(caller, wheelId);
    let existed = wheels.get(key) != null;
    wheels.remove(key);
    existed;
  };

  // ─── Spin ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func spinWheel(wheelId : Text) : async ?SpinEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can spin wheels");
    };
    let key = makeKey(caller, wheelId);
    switch (wheels.get(key)) {
      case null { null };
      case (?wheel) {
        if (wheel.options.size() == 0) { return null };
        var totalWeight : Nat = 0;
        let activeOptions = wheel.options.filter(func(opt) { opt.enabled });
        if (activeOptions.size() == 0) { return null };
        for (opt in activeOptions.vals()) {
          totalWeight += opt.weight;
        };
        if (totalWeight == 0) { return null };
        let raw = Int.abs(Time.now());
        var pick : Nat = raw % totalWeight;
        var selected = activeOptions[0];
        label breakLoop for (opt in activeOptions.vals()) {
          if (pick < opt.weight) {
            selected := opt;
            break breakLoop;
          };
          pick -= opt.weight;
        };
        let entry : SpinEntry = {
          timestamp = Time.now();
          selectedLabel = selected.optionLabel;
          selectedWeight = selected.weight;
        };
        let hKey = key # "-history";
        let prev = switch (history.get(hKey)) {
          case null { [] };
          case (?h) { h };
        };
        let newSize = Nat.min(prev.size() + 1, 20);
        let newHistory = Array.tabulate(newSize, func(i : Nat) : SpinEntry {
          if (i == 0) { entry } else { prev[i - 1] };
        });
        history.add(hKey, newHistory);
        ?entry;
      };
    };
  };

  public query ({ caller }) func getSpinHistory(wheelId : Text) : async [SpinEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access spin history");
    };
    let hKey = makeKey(caller, wheelId) # "-history";
    switch (history.get(hKey)) {
      case null { [] };
      case (?h) { h };
    };
  };
};
