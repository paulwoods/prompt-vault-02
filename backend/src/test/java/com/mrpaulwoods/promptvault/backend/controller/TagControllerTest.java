package com.mrpaulwoods.promptvault.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mrpaulwoods.promptvault.backend.dto.TagRequest;
import com.mrpaulwoods.promptvault.backend.dto.TagResponse;
import com.mrpaulwoods.promptvault.backend.entity.User;
import com.mrpaulwoods.promptvault.backend.service.TagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TagControllerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TagService tagService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private UUID userId;
    private User mockUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mockUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .passwordHash("password")
                .build();
    }

    @Test
    void getAllTags_ShouldReturnTagList() throws Exception {
        TagResponse tag = TagResponse.builder()
                .id(UUID.randomUUID())
                .name("My Tag")
                .build();

        when(tagService.getAllTags(userId)).thenReturn(List.of(tag));

        mockMvc.perform(get("/api/tags").with(user(mockUser)))
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
                        .with(user(mockUser))
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
                        .with(user(mockUser))
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
                        .with(user(mockUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteTag_ShouldReturn204() throws Exception {
        UUID tagId = UUID.randomUUID();
        doNothing().when(tagService).deleteTag(userId, tagId);

        mockMvc.perform(delete("/api/tags/{id}", tagId).with(user(mockUser)))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteTag_WhenNotFound_ShouldReturn404() throws Exception {
        UUID tagId = UUID.randomUUID();
        doThrow(new ResponseStatusException(NOT_FOUND, "Tag not found"))
                .when(tagService).deleteTag(any(UUID.class), eq(tagId));

        mockMvc.perform(delete("/api/tags/{id}", tagId).with(user(mockUser)))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllTags_WhenUnauthenticated_ShouldReturn401Or403() throws Exception {
        mockMvc.perform(get("/api/tags"))
                .andExpect(status().is4xxClientError());
    }
}
