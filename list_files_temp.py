
import os
import sys

def list_all_files(start_dir, output_file):
    all_files = []
    # Normalize start_dir to be an absolute path
    start_dir = os.path.abspath(start_dir)
    for root, dirs, files in os.walk(start_dir):
        # Modify dirs in-place to skip unwanted directories
        # Only check if directory name itself is in the skip list, not full path
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', 'test-results', '.gemini-tmp', '.agent']] # Added dist, test-results, .gemini-tmp, and .agent
        for file in files:
            file_path = os.path.join(root, file)
            # Make path relative to the initial start_dir
            relative_path = os.path.relpath(file_path, start_dir)
            all_files.append(relative_path)
    
    with open(output_file, 'w') as f:
        for file_path in all_files:
            f.write(file_path + '\n')

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python list_files_temp.py <start_directory> <output_file>")
        sys.exit(1)
    
    start_directory = sys.argv[1]
    output_file = sys.argv[2]
    list_all_files(start_directory, output_file)
