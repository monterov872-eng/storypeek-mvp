import 'package:flutter/material.dart';

import '../models/highlight_item.dart';

class HighlightCircle extends StatelessWidget {
  const HighlightCircle({
    super.key,
    required this.highlight,
    required this.onTap,
  });

  final HighlightItem highlight;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: 84,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFFB06BFF), Color(0xFF9B5CFF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: DecoratedBox(
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF000000),
                ),
                child: ClipOval(
                  child: Image.network(
                    highlight.coverUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.collections_bookmark_outlined,
                      color: Colors.white54,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              highlight.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall,
            ),
          ],
        ),
      ),
    );
  }
}
