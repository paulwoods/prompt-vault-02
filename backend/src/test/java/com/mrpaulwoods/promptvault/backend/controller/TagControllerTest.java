package com.mrpaulwoods.promptvault.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.TagRequest;
import com.mrpaulwoods.promptvault.backend.dto.TagResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.TagService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TagControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private MockMvc mockMvc;

    @Mock
    private TagService tagService;

    @InjectMocks
    private TagController tagController;

    private UUID userId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(tagController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();
        userId = UUID.randomUUID();
        mockUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .passwordHash("password")
                .build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(mockUser, null, mockUser.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getAllTags_ShouldReturnTagList() throws Exception {
        TagResponse tag = TagResponse.builder()
                .id(UUID.randomUUID())
                .name("My Tag")
                .build();

        when(tagService.getAllTags(userId)).thenReturn(List.of(tag));

        mockMvc.perform(get("/api/tags"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("My Tag"));
    }

    @Test
    void createTag_ShouldReturnCreatedTag() throws Exception {
        TagRequest request = TagRequest.builder().name("New Tag").build();
        TagResponse response = TagResponse.builder()
                .id(UUID.randomUUID())
                .name("New Tag")
                .build();

        when(tagService.createTag(eq(userId), any(TagRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Tag"));
    }

    @Test
    void updateTag_ShouldReturnUpdatedTag() throws Exception {
        UUID tagId = UUID.randomUUID();
        TagRequest request = TagRequest.builder().name("Updated Tag").comments("Some comment").build();
        TagResponse response = TagResponse.builder()
                .id(tagId)
                .name("Updated Tag")
                .comments("Some comment")
                .build();

        when(tagService.updateTag(eq(userId), eq(tagId), any(TagRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/tags/{id}", tagId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Tag"))
                .andExpect(jsonPath("$.comments").value("Some comment"));
    }

    @Test
    void updateTag_WhenNotFound_ShouldReturn404() throws Exception {
        UUID tagId = UUID.randomUUID();
        TagRequest request = TagRequest.builder().name("Updated Tag").build();

        when(tagService.updateTag(any(UUID.class), eq(tagId), any(TagRequest.class)))
                .thenThrow(new ResponseStatusException(NOT_FOUND, "Tag not found"));

        mockMvc.perform(put("/api/tags/{id}", tagId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteTag_ShouldReturn204() throws Exception {
        UUID tagId = UUID.randomUUID();
        doNothing().when(tagService).deleteTag(userId, tagId);

        mockMvc.perform(delete("/api/tags/{id}", tagId))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteTag_WhenNotFound_ShouldReturn404() throws Exception {
        UUID tagId = UUID.randomUUID();
        doThrow(new ResponseStatusException(NOT_FOUND, "Tag not found"))
                .when(tagService).deleteTag(any(UUID.class), eq(tagId));

        mockMvc.perform(delete("/api/tags/{id}", tagId))
                .andExpect(status().isNotFound());
    }
}
