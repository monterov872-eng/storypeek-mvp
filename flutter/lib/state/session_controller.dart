import 'package:flutter/foundation.dart';

import '../models/highlight_item.dart';
import '../models/post_item.dart';
import '../models/profile_response.dart';
import '../models/story_item.dart';
import '../services/local_history.dart';
import '../services/media_api.dart';
import '../ui/silent_view_status.dart';

class ProfileSnapshot {
  const ProfileSnapshot({
    required this.username,
    required this.fullName,
    required this.biography,
    required this.profilePictureUrl,
    required this.followersCount,
    required this.followingCount,
    required this.postsCount,
    required this.isPrivate,
    required this.posts,
    required this.stories,
    required this.highlights,
    this.storiesEmpty,
    this.storiesError,
    this.highlightsError,
    this.viewedAt,
  });

  final String username;
  final String fullName;
  final String biography;
  final String profilePictureUrl;
  final int followersCount;
  final int followingCount;
  final int postsCount;
  final bool isPrivate;
  final List<PostItem> posts;
  final List<StoryItem> stories;
  final List<HighlightItem> highlights;
  final SilentViewStatus? storiesEmpty;
  final SilentViewStatus? storiesError;
  final SilentViewStatus? highlightsError;
  final DateTime? viewedAt;
}

class SessionController extends ChangeNotifier {
  SessionController() {
    _init();
  }

  final MediaApi _api = MediaApi();
  final LocalHistory _history = LocalHistory();

  List<String> recentSearches = [];
  List<String> recentlyViewed = [];
  ProfileSnapshot? currentProfile;
  bool loading = false;
  SilentViewStatus? loadError;
  String? lastRequestedUsername;

  Future<void> _init() async {
    recentSearches = await _history.getRecentSearches();
    recentlyViewed = await _history.getRecentlyViewed();
    notifyListeners();
  }

  static String normalizeUsername(String raw) =>
      raw.trim().replaceFirst(RegExp(r'^@'), '');

  Future<bool> loadProfile(String rawUsername) async {
    final username = normalizeUsername(rawUsername);
    if (username.isEmpty) {
      loadError = const SilentViewStatus(SilentViewStatusKind.enterUsername);
      notifyListeners();
      return false;
    }

    loading = true;
    loadError = null;
    currentProfile = null;
    lastRequestedUsername = username;
    notifyListeners();

    ProfileResponse? profile;
    StoriesResponse? stories;
    HighlightsResponse? highlights;
    SilentViewStatus? profileError;
    SilentViewStatus? storiesError;
    SilentViewStatus? highlightsError;
    SilentViewStatus? storiesEmpty;

    try {
      profile = await _api.fetchProfile(username);
    } on MediaApiException catch (e) {
      profileError = SilentViewStatus.fromApiException(e);
    } catch (_) {
      profileError = const SilentViewStatus(SilentViewStatusKind.networkError);
    }

    final isPrivate = profile?.isPrivate ?? false;

    if (!isPrivate) {
      try {
        stories = await _api.fetchStories(username);
        if (stories.stories.isEmpty) {
          storiesEmpty = const SilentViewStatus(SilentViewStatusKind.noActiveStories);
        }
      } on MediaApiException catch (e) {
        storiesError = SilentViewStatus.fromApiException(e);
      } catch (_) {
        storiesError = const SilentViewStatus(SilentViewStatusKind.networkError);
      }

      try {
        highlights = await _api.fetchHighlights(username);
      } on MediaApiException catch (e) {
        highlightsError = SilentViewStatus.fromApiException(e);
      } catch (_) {
        highlightsError = const SilentViewStatus(SilentViewStatusKind.networkError);
      }
    }

    if (profile == null && stories == null && highlights == null) {
      loadError = SilentViewStatus.pickPrimary([
        profileError,
        storiesError,
        highlightsError,
      ]);
      loading = false;
      notifyListeners();
      return false;
    }

    final resolved = profile?.username ??
        stories?.username ??
        highlights?.username ??
        username;

    currentProfile = ProfileSnapshot(
      username: resolved,
      fullName: profile?.fullName ?? '',
      biography: profile?.biography ?? '',
      profilePictureUrl: profile?.profilePictureUrl ?? '',
      followersCount: profile?.followersCount ?? 0,
      followingCount: profile?.followingCount ?? 0,
      postsCount: profile?.postsCount ?? 0,
      isPrivate: isPrivate,
      posts: isPrivate ? const [] : profile?.posts ?? const [],
      stories: isPrivate ? const [] : stories?.stories ?? const [],
      highlights: isPrivate ? const [] : highlights?.highlights ?? const [],
      storiesEmpty: storiesEmpty,
      storiesError: storiesError,
      highlightsError: highlightsError,
      viewedAt: DateTime.now(),
    );

    await _history.addSearch(resolved);
    await _history.addViewed(resolved);
    recentSearches = await _history.getRecentSearches();
    recentlyViewed = await _history.getRecentlyViewed();

    loading = false;
    loadError = profileError;
    notifyListeners();
    return true;
  }
}
