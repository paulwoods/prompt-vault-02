# Spring Boot Entity – JPA

For spring boot entities that use lombok, dont add @Builder and     
@Data annotations. instead, add @Getter, @Setter, @NoArgsConstructor and         
@AllArgsConstructor.

# Spring Boot Entity – JDBC

For spring boot entities that use lombok, add @Builder, @Data, @NoArgsConstructor and         
@AllArgsConstructor.

# Spring Boot Unit Testing

* Add Unit tests for all code changes.
* Run all unit tests to validate code changes.
* Annotate test classes with @ExtendWith(MockitoExtension.class).
* Don't annotate with @SpringBootTest. This is not for unit tests.

# Spring Boot Integration Testing

* Name the files as *IT.java.
* Save the test classes in the integration folder
* Annotate with @SpringBootTest.
* Do not annotate with @ExtendWith(MockitoExtension.class).

