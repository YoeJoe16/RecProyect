package com.ucr.reco.service;


import com.ucr.reco.model.User;
import com.ucr.reco.repository.UserJpaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsersTest {

    @Mock
    private UserJpaRepository repository;

    @InjectMocks
    private UserService usuarioService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setName("Yoel");
        user.setEmail("yoel@email.com");
        user.setPassword("1234");
    }

    // encontrar usuario por ID, en caso de que funcione
    @Test
    void cuandoBuscoUsuarioExistente_debeRetornarlo() {
        when(repository.findById(1))
                .thenReturn(user);

        User resultado = usuarioService.getById(1);

        assertNotNull(resultado);
        assertEquals("Yoel", resultado.getName());
        verify(repository, times(1)).findById(1);
    }

    // usuario no existe, devuelve null
    @Test
    void cuandoBuscoUsuarioInexistente_debeRetornarNull() {
        when(repository.findById(99))
                .thenReturn(null);

        User resultado = usuarioService.getById(99);

        assertNull(resultado);
        verify(repository, times(1)).findById(99);
    }

    //  email ya existe, add devuelve null
    @Test
    void cuandoAgregoUsuarioConEmailDuplicado_debeRetornarNull() {
        com.ucr.reco.model.dto.UserDTO dto = new com.ucr.reco.model.dto.UserDTO();
        dto.setEmail("yoel@email.com");

        when(repository.existsByEmail("yoel@email.com"))
                .thenReturn(true);

        User resultado = usuarioService.add(dto);

        assertNull(resultado);
        verify(repository, never()).save(any());
    }
}
