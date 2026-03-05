package com.mrpaulwoods.promptvault.backend.controller;

import com.mrpaulwoods.promptvault.backend.dto.PromptResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.ForkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fork")
@RequiredArgsConstructor
public class ForkController {

    private final ForkService forkService;

    // PV-110: Fork a prompt from a share token
    @PostMapping("/{token}")
    public ResponseEntity<PromptResponse> fork(
            @AuthenticationPrincipal User user,
            @PathVariable String token) {
        return ResponseEntity.ok(forkService.forkFromShareToken(token, user.getId()));
    }
}
