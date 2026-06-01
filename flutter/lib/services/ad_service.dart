import 'dart:async';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

/// Google AdMob interstitial ads (test IDs only). Ads-only monetization — no subscriptions.
class AdService {
  AdService._();
  static final AdService instance = AdService._();

  static const String _androidTestAppId = 'ca-app-pub-3940256099942544~3347511713';
  static const String _iosTestAppId = 'ca-app-pub-3940256099942544~1458002511';
  static const String _androidTestInterstitial =
      'ca-app-pub-3940256099942544/1033173712';
  static const String _iosTestInterstitial =
      'ca-app-pub-3940256099942544/4411468910';

  bool _initialized = false;
  InterstitialAd? _interstitial;
  bool _loading = false;

  String get interstitialUnitId {
    if (Platform.isAndroid) return _androidTestInterstitial;
    if (Platform.isIOS) return _iosTestInterstitial;
    return _androidTestInterstitial;
  }

  Future<void> initialize() async {
    if (_initialized || kIsWeb) return;
    await MobileAds.instance.initialize();
    _initialized = true;
    loadInterstitial();
  }

  /// Preload the next interstitial. Safe to call repeatedly.
  void loadInterstitial() {
    if (kIsWeb || _loading || _interstitial != null) return;
    _loading = true;

    InterstitialAd.load(
      adUnitId: interstitialUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _loading = false;
          _interstitial = ad;
        },
        onAdFailedToLoad: (_) {
          _loading = false;
          _interstitial = null;
        },
      ),
    );
  }

  Future<void> _showOrSkip(Future<void> Function() onContinue) async {
    if (kIsWeb) {
      await onContinue();
      return;
    }

    final ad = _interstitial;
    if (ad == null) {
      loadInterstitial();
      await onContinue();
      return;
    }

    _interstitial = null;
    final completer = Completer<void>();

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        loadInterstitial();
        if (!completer.isCompleted) completer.complete();
      },
      onAdFailedToShowFullScreenContent: (ad, _) {
        ad.dispose();
        loadInterstitial();
        if (!completer.isCompleted) completer.complete();
      },
    );

    await ad.show();
    await completer.future;
    await onContinue();
  }

  /// One interstitial before opening stories. Continues if ad unavailable.
  Future<void> showAdBeforeStories(Future<void> Function() onContinue) {
    return _showOrSkip(onContinue);
  }

  /// One interstitial before opening a highlight album. Continues if ad unavailable.
  Future<void> showAdBeforeHighlight(Future<void> Function() onContinue) {
    return _showOrSkip(onContinue);
  }

  static String get appId {
    if (Platform.isIOS) return _iosTestAppId;
    return _androidTestAppId;
  }
}
