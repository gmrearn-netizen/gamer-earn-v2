import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type UserProfile = {
    username : Text;
    nextAdWatchTime : Time.Time;
    dailyAdCount : Nat;
    coinBalance : Nat;
  };

  module UserProfile {
    public func compare(user1 : UserProfile, user2 : UserProfile) : Order.Order {
      Text.compare(user1.username, user2.username);
    };
  };

  type RewardType = {
    #googlePlay;
    #amazon;
  };

  type RedeemStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type RedeemRequest = {
    id : Nat;
    user : Principal;
    rewardType : RewardType;
    amount : Nat;
    status : RedeemStatus;
    date : Time.Time;
  };

  module RedeemRequest {
    public func compare(redeem1 : RedeemRequest, redeem2 : RedeemRequest) : Order.Order {
      Nat.compare(redeem1.id, redeem2.id);
    };
  };

  type Notice = {
    title : Text;
    description : Text;
    date : Time.Time;
  };

  module Notice {
    public func compare(notice1 : Notice, notice2 : Notice) : Order.Order {
      Text.compare(notice1.title, notice2.title);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let users = Map.empty<Principal, UserProfile>();
  let redeemRequests = Map.empty<Nat, RedeemRequest>();
  let notices = Map.empty<Nat, Notice>();

  var nextRedeemRequestId = 1;
  var nextNoticeId = 1;

  public query ({ caller }) func isRegistered() : async Bool {
    users.containsKey(caller);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    users.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    users.add(caller, profile);
  };

  public query ({ caller }) func getCoinBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view coin balance");
    };
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile.coinBalance };
    };
  };

  public shared ({ caller }) func updateUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their username");
    };

    let updatedProfile : UserProfile = switch (users.get(caller)) {
      case (null) {
        {
          username;
          nextAdWatchTime = Time.now();
          dailyAdCount = 0;
          coinBalance = 0;
        };
      };
      case (?profile) {
        {
          profile with
          username;
        };
      };
    };

    users.add(caller, updatedProfile);
  };

  public shared ({ caller }) func recordAdWatch() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record ad watches");
    };

    let now = Time.now();

    let userProfile = switch (users.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    if (userProfile.dailyAdCount >= 15) {
      Runtime.trap("Daily ad watch limit reached");
    };

    if (now < userProfile.nextAdWatchTime) {
      Runtime.trap("Ad watch not allowed yet");
    };

    let updatedProfile : UserProfile = {
      userProfile with
      dailyAdCount = userProfile.dailyAdCount + 1;
      nextAdWatchTime = now + 60_000_000_000;
      coinBalance = userProfile.coinBalance + 10;
    };

    users.add(caller, updatedProfile);
  };

  public shared ({ caller }) func submitRedeemRequest(rewardType : RewardType, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit redeem requests");
    };

    let userProfile = switch (users.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?profile) { profile };
    };

    let requiredCoins = amount * 10;
    if (userProfile.coinBalance < requiredCoins) {
      Runtime.trap("Insufficient coins");
    };

    let newRedeemRequest : RedeemRequest = {
      id = nextRedeemRequestId;
      user = caller;
      rewardType;
      amount;
      status = #pending;
      date = Time.now();
    };

    let updatedProfile : UserProfile = {
      userProfile with
      coinBalance = userProfile.coinBalance - requiredCoins;
    };

    redeemRequests.add(nextRedeemRequestId, newRedeemRequest);
    users.add(caller, updatedProfile);

    nextRedeemRequestId += 1;
  };

  public shared ({ caller }) func updateRedeemStatus(redeemId : Nat, status : RedeemStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can update redemption request status");
    };

    switch (redeemRequests.get(redeemId)) {
      case (null) { Runtime.trap("Redeem request not found") };
      case (?request) {
        let updatedRequest : RedeemRequest = {
          request with
          status;
        };
        redeemRequests.add(redeemId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func postNotice(title : Text, description : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can post notice");
    };

    let newNotice : Notice = {
      title;
      description;
      date = Time.now();
    };

    notices.add(nextNoticeId, newNotice);
    nextNoticeId += 1;
  };

  public func postNoticeWithPassword(title : Text, description : Text, password : Text) : async () {
    if (password != "GamerAdmin@06052006#2026") {
      Runtime.trap("Unauthorized: Invalid admin password");
    };

    let newNotice : Notice = {
      title;
      description;
      date = Time.now();
    };

    notices.add(nextNoticeId, newNotice);
    nextNoticeId += 1;
  };

  public query ({ caller }) func getNotices() : async [Notice] {
    notices.values().toArray().sort();
  };

  public query ({ caller }) func getRedeemHistory() : async [RedeemRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view redeem history");
    };
    redeemRequests.values().filter(
      func(request) { request.user == caller }
    ).toArray().sort();
  };

  public query ({ caller }) func getAllRedeemRequests() : async [RedeemRequest] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admin can view all redeem requests");
    };
    redeemRequests.values().toArray().sort();
  };
};
