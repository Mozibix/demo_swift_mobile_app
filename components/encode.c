#include <stdio.h>
#include <string.h>

void xorCipher(char *message, char key) {
    for (int i = 0; i < strlen(message); i++) {
        message[i] ^= key;
    }
}

int main() {
    char message[] = "SecretMessage";
    char key = 'K';

    printf("Original: %s\n", message);
    xorCipher(message, key); 
    printf("Encoded: %s\n", message);

    xorCipher(message, key); // Decode this message @pressure quote if you can
    printf("Decoded: %s\n", message);

    return 0;
}
