# Makefile for NetMon Hardware Interface Library - Windows Version
CC = gcc
CXX = g++
CFLAGS = -Wall -Wextra -std=c99 -O2
CXXFLAGS = -Wall -Wextra -std=c++14 -O2
LDFLAGS = -lws2_32
INCLUDES = -I.

# Library name
LIBNAME = libnetmon_hw
STATIC_LIB = $(LIBNAME).a
SHARED_LIB = $(LIBNAME).dll

# Source files
C_SOURCES = hardware_sim.c
CPP_SOURCES = 
HEADERS = hardware_interface.h

# Object files
C_OBJECTS = $(C_SOURCES:.c=.o)
CPP_OBJECTS = $(CPP_SOURCES:.cpp=.o)
OBJECTS = $(C_OBJECTS) $(CPP_OBJECTS)

# Default target
all: rectifier_monitor.exe

# Rectifier Monitor - Ana SMU programı
rectifier_monitor.exe: rectifier_monitor.c
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $< $(LDFLAGS)

# Hardware Server
hardware_server.exe: hardware_server.c
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $< $(LDFLAGS)

# Test program
test: test_hardware.exe
test_hardware.exe: test_hardware.c $(STATIC_LIB)
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $< -L. -lnetmon_hw -lm

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

# Clean build artifacts
clean:
	del /Q *.o *.exe *.a *.dll 2>nul || echo Cleaned

# Help
help:
	@echo "Available targets:"
	@echo "  all                - Build rectifier_monitor.exe (main SMU program)"
	@echo "  rectifier_monitor.exe - Build main rectifier monitoring program"
	@echo "  hardware_server.exe   - Build TCP server for testing"
	@echo "  test               - Build test program"
	@echo "  clean              - Remove all build artifacts"
	@echo "  help               - Show this help message"

.PHONY: all clean test help