import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type OldWheelOption = {
    id : Text;
    optionLabel : Text;
    weight : Nat;
    color : ?Text;
  };

  type OldWheel = {
    id : Text;
    name : Text;
    options : [OldWheelOption];
    createdAt : Int;
    updatedAt : Int;
  };

  type OldSpinEntry = {
    timestamp : Int;
    selectedLabel : Text;
    selectedWeight : Nat;
  };

  type OldActor = {
    var wheels : Map.Map<Text, OldWheel>;
    var history : Map.Map<Text, [OldSpinEntry]>;
  };

  type NewWheelOption = {
    id : Text;
    optionLabel : Text;
    weight : Nat;
    color : ?Text;
    enabled : Bool;
  };

  type NewWheel = {
    id : Text;
    name : Text;
    options : [NewWheelOption];
    createdAt : Int;
    updatedAt : Int;
  };

  type NewSpinEntry = {
    timestamp : Int;
    selectedLabel : Text;
    selectedWeight : Nat;
  };

  type NewUserProfile = {
    name : Text;
  };

  type NewActor = {
    var wheels : Map.Map<Text, NewWheel>;
    var history : Map.Map<Text, [NewSpinEntry]>;
    var userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newWheels = old.wheels.map<Text, OldWheel, NewWheel>(
      func(_id, oldWheel) {
        {
          id = oldWheel.id;
          name = oldWheel.name;
          options = oldWheel.options.map(func(oldOpt) { { oldOpt with enabled = true } });
          createdAt = oldWheel.createdAt;
          updatedAt = oldWheel.updatedAt;
        };
      }
    );
    let newHistory = old.history.map<Text, [OldSpinEntry], [NewSpinEntry]>(
      func(_id, oldArray) {
        oldArray.map(func(entry) { entry });
      }
    );
    let newUserProfiles = Map.empty<Principal, NewUserProfile>();
    {
      var wheels = newWheels;
      var history = newHistory;
      var userProfiles = newUserProfiles;
    };
  };
};
