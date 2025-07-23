# Makefile for NetMon Hardware Interface Library
CC = gcc
CXX = g++
CFLAGS = -Wall -Wextra -std=c99 -fPIC -O2
CXXFLAGS = -Wall -Wextra -std=c++14 -fPIC -O2
LDFLAGS = -shared
INCLUDES = -I.

# Library name
LIBNAME = libnetmon_hw
STATIC_LIB = $(LIBNAME).a
SHARED_LIB = $(LIBNAME).so

# Source files
C_SOURCES = hardware_sim.c
CPP_SOURCES = 
HEADERS = hardware_interface.h

# Object files
C_OBJECTS = $(C_SOURCES:.c=.o)
CPP_OBJECTS = $(CPP_SOURCES:.cpp=.o)
OBJECTS = $(C_OBJECTS) $(CPP_OBJECTS)

# Default target
all: $(STATIC_LIB) $(SHARED_LIB)

# Compile C source files
%.o: %.c $(HEADERS)
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

# Compile C++ source files
%.o: %.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) $(INCLUDES) -c $< -o $@

# Create static library
$(STATIC_LIB): $(OBJECTS)
	ar rcs $@ $^

# Create shared library
$(SHARED_LIB): $(OBJECTS)
	$(CC) $(LDFLAGS) -o $@ $^

# Test program
test: test_hardware
test_hardware: test_hardware.c $(STATIC_LIB)
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $< -L. -lnetmon_hw -lm

# Clean build artifacts
clean:
	rm -f $(OBJECTS) $(STATIC_LIB) $(SHARED_LIB) test_hardware

# Install library (requires sudo)
install: $(SHARED_LIB) $(STATIC_LIB)
	sudo cp $(SHARED_LIB) /usr/local/lib/
	sudo cp $(STATIC_LIB) /usr/local/lib/
	sudo cp $(HEADERS) /usr/local/include/
	sudo ldconfig

# Uninstall library (requires sudo)
uninstall:
	sudo rm -f /usr/local/lib/$(SHARED_LIB)
	sudo rm -f /usr/local/lib/$(STATIC_LIB)
	sudo rm -f /usr/local/include/hardware_interface.h
	sudo ldconfig

# Help
help:
	@echo "Available targets:"
	@echo "  all      - Build both static and shared libraries"
	@echo "  static   - Build static library only"
	@echo "  shared   - Build shared library only"
	@echo "  test     - Build test program"
	@echo "  clean    - Remove all build artifacts"
	@echo "  install  - Install library system-wide (requires sudo)"
	@echo "  uninstall- Remove library from system (requires sudo)"
	@echo "  help     - Show this help message"

.PHONY: all clean install uninstall test help