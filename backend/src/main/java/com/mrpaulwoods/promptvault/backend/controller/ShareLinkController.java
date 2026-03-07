package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.EmailShareRequest;
import com.mrpaulwoods.promptvault.backend.dto.PublicShareResponse;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkRequest;
import com.mrpaulwoods.promptvault.backend.dto.ShareLinkResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.ShareLinkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ShareLinkController {

    private final ShareLinkService shareLinkService;

    // PV-100: Create share link
    @PostMapping("/api/prompts/{promptId}/share-links")
    public ResponseEntity<ShareLinkResponse> createShareLink(
            @AuthenticationPrincipal User user,
            @PathVariable UUID promptId,
            @RequestBody(required = false) ShareLinkRequest request) {
        return ResponseEntity.ok(shareLinkService.createShareLink(promptId, user.getId(), request));
    }

    // PV-101: List share links
    @GetMapping("/api/prompts/{promptId}/share-links")
    public ResponseEntity<List<ShareLinkResponse>> listShareLinks(
            @AuthenticationPrincipal User user,
            @PathVariable UUID promptId) {
        return ResponseEntity.ok(shareLinkService.listShareLinks(promptId, user.getId()));
    }

    // PV-102: Edit expiration
    @PutMapping("/api/share-links/{id}")
    public ResponseEntity<ShareLinkResponse> updateExpiration(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id,
            @RequestBody ShareLinkRequest request) {
        return ResponseEntity.ok(shareLinkService.updateExpiration(id, user.getId(), request));
    }

    // PV-103: Revoke share link
    @DeleteMapping("/api/share-links/{id}")
    public ResponseEntity<Void> revokeShareLink(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id) {
        shareLinkService.revokeShareLink(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    // PV-120: Email a share link
    @PostMapping("/api/prompts/{promptId}/share-links/email")
    public ResponseEntity<Void> emailShareLink(
            @AuthenticationPrincipal User user,
            @PathVariable UUID promptId,
            @Valid @RequestBody EmailShareRequest request) {
        shareLinkService.emailShareLink(promptId, user.getId(), request);
        return ResponseEntity.ok().build();
    }

    // PV-104: Public share endpoint (no auth required)
    @GetMapping("/api/share/{token}")
    public ResponseEntity<PublicShareResponse> getPublicShare(@PathVariable String token) {
        return ResponseEntity.ok(shareLinkService.getPublicShare(token));
    }

    // PV-106: Export as .txt (public)
    @GetMapping("/api/share/{token}/export")
    public ResponseEntity<byte[]> exportPublicShare(@PathVariable String token) {
        PublicShareResponse share = shareLinkService.getPublicShare(token);
        String content = share.getTitle() + "\n\n" + share.getBody().replaceAll("<[^>]+>", "");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", share.getTitle().replaceAll("[^a-zA-Z0-9 _-]", "_") + ".txt");
        return ResponseEntity.ok().headers(headers).body(content.getBytes());
    }
}
