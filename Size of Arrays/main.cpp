#include <iostream>

using namespace std;

int main()
{
    int figure[] = {5, 7, 8};

    cout << "Size of Figure >>"<< sizeof(figure) <<endl; //----size of arrays

    for (int a=0; a<3; a++)
    {
        cout << figure[a] <<endl;

    }

    //----size of multidimensional arrays----
    return 0;
}
